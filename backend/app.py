# flask file

import os

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
import enum
import os
from datetime import timezone
from sqlalchemy import text, Enum
from models import OrderItem, User, UserRole, CustomerProfile, EmployeeProfile, Order, Trip, Product
from database import db
import time
import requests
import json
from datetime import datetime


app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
# kept main 
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://user:password@db:5432/delivery_db')
# Connect the db instance to our flask app
db.init_app(app)


MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")

@app.route('/products', methods=['GET'])
def get_products():
    products = Product.query.order_by(Product.product_id.asc()).all()
    return jsonify([
        {
            "id": p.product_id,
            "name": p.name,
            "category": p.category,
            "price": p.cost,
            "weight": p.weight,
            "stock": p.stock,
            "description": p.description,
            "imageUrl": p.image_url or "",
        }
        for p in products
    ])
    

WAREHOUSE = {
    "name": "warehouse",
    "coordinates": [-121.8900, 37.3350]
}

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Check if User exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already registered"}), 400
    
    # Convert string role from JSON to Python Enum
    try:
        requested_role = UserRole(data['role'].lower())
    except (ValueError, KeyError):
        return jsonify({"error": "Invalid role"}), 400

    new_user = User(
        first_name=data['firstName'],
        last_name=data['lastName'],
        email=data['email'],
        phone_number=data['phone'],
        role = requested_role
    )
    new_user.set_password(data['password'])
    
    db.session.add(new_user)
    db.session.flush()

    # create + assign the actual profile
    if requested_role == UserRole.CUSTOMER:
        profile = CustomerProfile(user_id=new_user.id, delivery_address=data.get('deliveryAddress', ''))
        db.session.add(profile)
    elif requested_role == UserRole.EMPLOYEE:
        profile = EmployeeProfile(user_id=new_user.id, employee_id=data.get('employeeId', ''))
        db.session.add(profile)

    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and user.check_password(data['password']):
        # generate JWT here, eventually
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "role": user.role.value,
            }
        }), 200
        
    return jsonify({"error": "Invalid credentials"}), 401


@app.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.filter_by(status="pending").all()

    return jsonify([
        {
            "id": o.order_id,
            "label": f"Order #{o.order_id}",
            "weight": o.total_weight,
            "address": o.delivery_address,
            "city": o.delivery_city,
            "state": o.delivery_state,
            "zip": o.delivery_zip,
            "price": o.total_cost,
            "lat": o.delivery_lat,
            "lng": o.delivery_lng,
            "status": o.status,
            "orderedAt": o.ordered_at.isoformat() if o.ordered_at else None
        }
        for o in orders
    ])

@app.route('/orders', methods=['POST'])
def create_order():
    data = request.get_json()

    delivery_info = data.get("deliveryInfo", {})
    items = data.get("items", [])

    if not items:
        return jsonify({"error": "No items in order"}), 400
    
    user_id = data.get("userId")

    if not user_id:
        return jsonify({"error": "Missing user"}), 400

    customer = CustomerProfile.query.filter_by(user_id=user_id).first()

    if not customer:
        return jsonify({"error": "Customer profile not found"}), 400

    customer_id = customer.id

    try:
        #TODO: update the null inputs later with actual data from frontend
        new_order = Order(
            customer_id=customer_id,
            delivery_address=delivery_info.get("addressLine1", ""),
            delivery_city=delivery_info.get("city", ""),
            delivery_zip=delivery_info.get("zipCode", ""),
            subtotal=data.get("subtotal", 0),
            total_weight=data.get("total_weight", 0),
            delivery_fee=data.get("deliveryFee", 0),
            total_cost=data.get("total", 0)
        )

        db.session.add(new_order)
        db.session.flush()

        for i in items:
            product = Product.query.get(i["product"]["id"])
            if not product:
                db.session.rollback()
                return jsonify({"error": f"Product with id {i['product']['id']} not found"}), 400   
            if product.stock < i["quantity"]:
                db.session.rollback()
                return jsonify({"error": f"Not enough stock for product {product.name}"}), 400      
            product.stock -= i["quantity"]

            order_item = OrderItem(
                    order_id=new_order.order_id,
                    product_id=i["product"]["id"],
                    quantity=i["quantity"],
                    unit_price=product.cost,
                    unit_weight=product.weight
                )                   
            
            db.session.add(order_item)

        db.session.commit()


        return jsonify({"message": "Order created", "order_id": new_order.order_id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500        



def build_v1_coordinates(selected_orders):
    coords = [f"{WAREHOUSE['coordinates'][0]},{WAREHOUSE['coordinates'][1]}"]

    for order in selected_orders:
        coords.append(f"{order.delivery_lng},{order.delivery_lat}")

    return ";".join(coords)

def build_directions_coordinates(ordered_orders, return_to_warehouse=True):
    coords = [f"{WAREHOUSE['coordinates'][0]},{WAREHOUSE['coordinates'][1]}"]

    for order in ordered_orders:
        coords.append(f"{order.delivery_lng},{order.delivery_lat}")

    if return_to_warehouse:
        coords.append(f"{WAREHOUSE['coordinates'][0]},{WAREHOUSE['coordinates'][1]}")

    return ";".join(coords)

def get_traffic_aware_route(ordered_orders, return_to_warehouse=True):
    coordinates = build_directions_coordinates(
        ordered_orders,
        return_to_warehouse=return_to_warehouse
    )

    url = f"https://api.mapbox.com/directions/v5/mapbox/driving-traffic/{coordinates}"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "geometries": "geojson",
        "overview": "full",
        "steps": "false"
    }

    resp = requests.get(url, params=params, timeout=30)

    if resp.status_code != 200:
        raise Exception(f"Directions API failed: {resp.text}")

    data = resp.json()
    routes = data.get("routes", [])

    if not routes:
        raise Exception("No traffic-aware routes returned")

    return routes[0]



def transform_v1_solution_for_frontend(selected_orders, solution):
    trips = solution.get("trips", [])
    waypoints = solution.get("waypoints", [])

    if not trips:
        return {
            "suggestedRoutes": [],
            "routePreview": None,
        }

    order_by_input_index = {
        index + 1: order for index, order in enumerate(selected_orders)
    }

    optimized_order_entries = []

    for waypoint_input_index, waypoint in enumerate(waypoints):
        if waypoint_input_index == 0:
            continue

        optimized_position = waypoint.get("waypoint_index")
        order = order_by_input_index.get(waypoint_input_index)

        if order is None or optimized_position is None:
            continue

        optimized_order_entries.append({
            "optimized_position": optimized_position,
            "order": order,
        })

    optimized_order_entries.sort(key=lambda x: x["optimized_position"])
    ordered_orders = [entry["order"] for entry in optimized_order_entries]

    if not ordered_orders:
        return {
            "suggestedRoutes": [],
            "routePreview": None,
        }

    traffic_route = get_traffic_aware_route(
        ordered_orders,
        return_to_warehouse=True
    )

    route_stops = []
    map_points = []

    for i, order in enumerate(ordered_orders, start=1):
        route_stops.append({
            "label": str(i),
            "address": order.delivery_address,
        })

        map_points.append({
            "lng": order.delivery_lng,
            "lat": order.delivery_lat,
            "label": str(i),
            "completed": False,
        })

    total_distance_km = round((traffic_route.get("distance", 0) or 0) / 1000, 1)
    estimated_time_min = round((traffic_route.get("duration", 0) or 0) / 60)
    geometry = traffic_route.get("geometry")

    suggested_route = {
        "id": 1,
        "title": "Optimized Route",
        "subtitle": "Traffic-aware ETA",
        "estimatedTime": estimated_time_min,
        "totalDistance": total_distance_km,
        "stops": route_stops,
    }

    return {
        "suggestedRoutes": [suggested_route],
        "routePreview": {
            "orderIds": [o.order_id for o in ordered_orders],
            "estimatedTime": estimated_time_min,
            "totalDistance": total_distance_km,
            "totalWeight": sum((o.total_weight or 0) for o in ordered_orders),
            "routeGeometry": geometry,
            "mapPoints": map_points,
        },
    }

@app.route("/optimize-routes", methods=["POST"])
def optimize_routes():
    data = request.get_json()
    selected_order_ids = data.get("orderIds", [])

    if not selected_order_ids:
        return jsonify({"error": "No orders selected"}), 400

    selected_orders = Order.query.filter(Order.order_id.in_(selected_order_ids)).all()

    if not selected_orders:
        return jsonify({"error": "No matching orders found"}), 404

    missing_coords = [
        o.order_id
        for o in selected_orders
        if o.delivery_lat is None or o.delivery_lng is None
    ]
    if missing_coords:
        return jsonify(
            {
                "error": "Some selected orders are missing coordinates",
                "orderIds": missing_coords,
            }
        ), 400

    if not MAPBOX_ACCESS_TOKEN:
        return jsonify({"error": "MAPBOX_ACCESS_TOKEN is not configured"}), 500

    MAX_ORDERS_PER_TRIP = 10
    MAX_TOTAL_WEIGHT = 200

    if len(selected_orders) > MAX_ORDERS_PER_TRIP:
        return jsonify(
            {
                "error": f"A robot can carry at most {MAX_ORDERS_PER_TRIP} orders per trip"
            }
        ), 400

    total_selected_weight = sum((o.total_weight or 0) for o in selected_orders)

    if total_selected_weight > MAX_TOTAL_WEIGHT:
        return jsonify(
            {
                "error": f"Selected orders weigh {total_selected_weight} lbs. Maximum allowed is {MAX_TOTAL_WEIGHT} lbs per trip."
            }
        ), 400

    coordinates = build_v1_coordinates(selected_orders)

    url = f"https://api.mapbox.com/optimized-trips/v1/mapbox/driving/{coordinates}"
    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "source": "first",
        "roundtrip": "true",
        "geometries": "geojson",
        "overview": "full",
        "steps": "false",
    }

    resp = requests.get(url, params=params, timeout=30)

    if resp.status_code != 200:
        return jsonify(
            {
                "error": "Failed to retrieve optimization",
                "details": resp.text,
            }
        ), 500

    solution = resp.json()

    if solution.get("code") != "Ok":
        return jsonify(
            {
                "error": "Mapbox optimization failed",
                "details": solution,
            }
        ), 400

    try:
        result = transform_v1_solution_for_frontend(selected_orders, solution)
        return jsonify(result), 200
    except Exception as e:
        return jsonify(
            {
                "error": "Traffic-aware routing failed",
                "details": str(e),
            }
        ), 500

def build_active_delivery_from_trip(trip):
    assigned_orders = (
        Order.query.filter(Order.trip_id == trip.trip_id)
        .order_by(Order.order_id.asc())
        .all()
    )

    map_points = []
    for i, order in enumerate(assigned_orders, start=1):
        if order.delivery_lat is None or order.delivery_lng is None:
            continue

        map_points.append({
            "lng": order.delivery_lng,
            "lat": order.delivery_lat,
            "label": str(i),
            "completed": order.status == "delivered",
        })

    route_geometry = None
    traveled_path = None

    if trip.route_geometry:
        try:
            route_geometry = json.loads(trip.route_geometry)
            coords = route_geometry.get("coordinates", [])
            if coords:
                current_index = trip.current_index or 0
                traveled_coords = coords[: current_index + 1]
                traveled_path = {
                    "type": "LineString",
                    "coordinates": traveled_coords,
                }
        except Exception:
            route_geometry = None
            traveled_path = None

    active_delivery = {
        "tripId": f"Trip #{trip.trip_id}",
        "tripNumericId": trip.trip_id,
        "robotId": "Robot-01",
        "eta": round(trip.estimated_time or 0),
        "mapPoints": map_points,
        "mapLines": [],
        "routeGeometry": route_geometry,
        "traveledPath": traveled_path,
        "robotPosition": {
            "lng": trip.current_lng,
            "lat": trip.current_lat,
        } if trip.current_lng is not None and trip.current_lat is not None else None,
        "status": trip.status,
    }

    return {"activeDelivery": active_delivery}

@app.route("/approve-route", methods=["POST"])
def approve_route():
    data = request.get_json()

    route_data = data.get("routeData")
    order_ids = data.get("orderIds", [])

    if not route_data:
        return jsonify({"error": "Missing routeData"}), 400

    if not order_ids:
        return jsonify({"error": "Missing orderIds"}), 400

    selected_orders = Order.query.filter(Order.order_id.in_(order_ids)).all()

    if not selected_orders:
        return jsonify({"error": "No matching orders found"}), 404

    already_assigned = [o.order_id for o in selected_orders if o.trip_id is not None]
    if already_assigned:
        return jsonify(
            {
                "error": "Some orders are already assigned to a trip",
                "orderIds": already_assigned,
            }
        ), 400

    new_trip = Trip(
        status="assigned",
        total_weight=route_data.get("totalWeight", 0),
        total_orders=len(order_ids),
        estimated_time=route_data.get("estimatedTime", 0),
        total_distance=route_data.get("totalDistance", 0),
        route_geometry=json.dumps(route_data.get("routeGeometry"))
        if route_data.get("routeGeometry")
        else None,
    )

    db.session.add(new_trip)
    db.session.flush()

    for order in selected_orders:
        order.trip_id = new_trip.trip_id
        order.status = "assigned"

    db.session.commit()

    return jsonify({"activeDelivery": build_active_delivery_from_trip(new_trip)["activeDelivery"]}), 201


@app.route("/active-delivery", methods=["GET"])
def get_active_delivery():
    active_trip = (
        Trip.query.filter(Trip.status.in_(["assigned", "in_progress"]))
        .order_by(Trip.created_at.desc())
        .first()
    )

    if not active_trip:
        return jsonify({"activeDelivery": None}), 200

    return jsonify(build_active_delivery_from_trip(active_trip)), 200


@app.route("/start-trip/<int:trip_id>", methods=["POST"])
def start_trip(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    if trip.status not in ["assigned", "in_progress"]:
        return jsonify({"error": "Trip cannot be started"}), 400

    route_geometry = None
    try:
        route_geometry = json.loads(trip.route_geometry) if trip.route_geometry else None
    except Exception:
        return jsonify({"error": "Invalid route geometry"}), 400

    if not route_geometry or "coordinates" not in route_geometry:
        return jsonify({"error": "No route coordinates available"}), 400

    coords = route_geometry["coordinates"]
    if not coords:
        return jsonify({"error": "Empty route coordinates"}), 400

    trip.status = "in_progress"
    trip.started_at = trip.started_at or datetime.utcnow()
    trip.current_index = 0
    trip.current_lng = coords[0][0]
    trip.current_lat = coords[0][1]

    db.session.commit()

    return jsonify({"message": "Trip started"}), 200

def is_near(lng1, lat1, lng2, lat2, threshold=0.0005):
    return abs(lng1 - lng2) <= threshold and abs(lat1 - lat2) <= threshold

@app.route("/trip-progress/<int:trip_id>", methods=["POST"])
def advance_trip_progress(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    if trip.status != "in_progress":
        return jsonify({"error": "Trip is not in progress"}), 400

    try:
        route_geometry = json.loads(trip.route_geometry) if trip.route_geometry else None
    except Exception:
        return jsonify({"error": "Invalid route geometry"}), 400

    if not route_geometry or "coordinates" not in route_geometry:
        return jsonify({"error": "No route coordinates"}), 400

    coords = route_geometry["coordinates"]
    if not coords:
        return jsonify({"error": "Empty route coordinates"}), 400

    next_index = (trip.current_index or 0) + 1

    if next_index >= len(coords):
        trip.current_index = len(coords) - 1
        trip.current_lng = coords[-1][0]
        trip.current_lat = coords[-1][1]
        trip.status = "completed"
        trip.completed_at = datetime.utcnow()

        orders = Order.query.filter_by(trip_id=trip.trip_id).all()
        for order in orders:
            order.status = "delivered"

        db.session.commit()

        return jsonify({
            "message": "Trip completed",
            "completed": True,
            **build_active_delivery_from_trip(trip)
        }), 200

    trip.current_index = next_index
    trip.current_lng = coords[next_index][0]
    trip.current_lat = coords[next_index][1]

    assigned_orders = Order.query.filter_by(trip_id=trip.trip_id).all()
    for order in assigned_orders:
        if (
            order.status != "delivered"
            and order.delivery_lng is not None
            and order.delivery_lat is not None
            and is_near(
                trip.current_lng,
                trip.current_lat,
                order.delivery_lng,
                order.delivery_lat
            )
        ):
            order.status = "delivered"

    db.session.commit()

    return jsonify({
        "completed": False,
        **build_active_delivery_from_trip(trip)
    }), 200


@app.route('/profile', methods=['GET'])
def get_profile():
    email = request.args.get('email', '').strip().lower()

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter(db.func.lower(User.email) == email).first()

    if not user:
        return jsonify({"error": "User not found"}), 404

    customer_profile = user.customer_profile
    created_at = user.created_at.astimezone(timezone.utc) if user.created_at else None

    return jsonify({
        "id": user.id,  
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phone": user.phone_number,
        "address": customer_profile.delivery_address if customer_profile else "",
        "createdAt": created_at.isoformat() if created_at else None,
        "role": user.role.value,
    }), 200



@app.route('/inventory', methods=['GET'])
def get_inventory():
    products = Product.query.all()

    return jsonify([
        {
            "id": str(product.product_id),
            "name": product.name,
            "sku": f"PROD-{product.product_id:03d}",
            "category": (product.category or "").lower(),
            "quantity": product.stock,
            "weight": str(product.weight),
            "price": product.cost,
            "reorderLevel": 10,
            "lastRestocked": (
                product.updated_at.strftime("%Y-%m-%d")
                if product.updated_at
                else (
                    product.created_at.strftime("%Y-%m-%d")
                    if product.created_at
                    else ""
                )
            ),
        }
        for product in products
    ]), 200



@app.route('/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    data = request.get_json()

    product.name = data.get("name", product.name)
    product.description = data.get("description", product.description)
    product.weight = float(data.get("weight", product.weight))
    product.cost = float(data.get("price", product.cost))
    product.category = data.get("category", product.category)
    product.stock = int(data.get("quantity", product.stock))

    db.session.commit()

    return jsonify({
        "message": "Product updated successfully",
        "product": {
            "id": str(product.product_id),
            "name": product.name,
            "sku": f"PROD-{product.product_id:03d}",
            "category": (product.category or "").lower(),
            "quantity": product.stock,
            "weight": str(product.weight),
            "price": product.cost,
            "reorderLevel": 10,
            "lastRestocked": (
                product.updated_at.strftime("%Y-%m-%d")
                if product.updated_at
                else (
                    product.created_at.strftime("%Y-%m-%d")
                    if product.created_at
                    else ""
                )
            ),
        }
    }), 200

@app.route("/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    try:
        product = Product.query.get(product_id)

        if not product:
            return jsonify({"error": "Product not found"}), 404

        db.session.delete(product)
        db.session.commit()

        return jsonify({"message": "Product deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@app.route("/products", methods=["POST"])
def create_product():
    try:
        data = request.get_json()

        new_product = Product(
            name=data.get("name"),
            description=data.get("description", ""),
            weight=float(data.get("weight", 0)),
            cost=float(data.get("price", 0)),
            category=data.get("category"),
            stock=int(data.get("quantity", 0)),
        )

        db.session.add(new_product)
        db.session.commit()

        return jsonify({
            "message": "Product created successfully",
            "id": new_product.product_id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend is running"
    }), 200

@app.route('/orders/history', methods=['GET'])
def get_order_history():
    orders = Order.query.order_by(Order.ordered_at.desc()).all()

    return jsonify([
        {
            "order_id": o.order_id,
            "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
            "total_cost": o.total_cost,
            "status": o.status,
            "item_count": len(o.order_items)
        }
        for o in orders
    ]), 200

@app.route('/reports', methods=['POST'])
def create_report():
    data = request.get_json()

    order_id = data.get('order_id')
    customer_id = data.get('customer_id')
    report_type = data.get('report_type', '').strip()
    description = data.get('description', '').strip()

    if not all([order_id, customer_id, report_type, description]):
        return jsonify({"error": "Missing required fields"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    if order.customer_id != customer_id:
        return jsonify({"error": "Order does not belong to this customer"}), 403

    report = Report(
        order_id=order_id,
        customer_id=customer_id,
        report_type=report_type,
        description=description,
        status="open",
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({"message": "Report submitted successfully", "report_id": report.report_id}), 201


@app.route('/reports', methods=['GET'])
def get_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()

    return jsonify([
        {
            "report_id": r.report_id,
            "order_id": r.order_id,
            "customer_id": r.customer_id,
            "report_type": r.report_type,
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]), 200


@app.route('/reports/<int:report_id>', methods=['PUT'])
def update_report(report_id):
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json()
    new_status = data.get('status', '').strip()

    if new_status not in ("open", "in_review", "resolved"):
        return jsonify({"error": "Invalid status"}), 400

    report.status = new_status
    db.session.commit()

    return jsonify({"message": "Report updated successfully"}), 200


# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)



