import os
import json
import requests
from functools import wraps
from datetime import datetime, timezone
from werkzeug.utils import secure_filename
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from sqlalchemy import text
import os
from datetime import timezone
from models import OrderItem, User, UserRole, CustomerProfile, EmployeeProfile, Order, Trip, Product, Report, ReportMessage
from database import db

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL',
    'postgresql://user:password@db:5432/delivery_db'
)
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret-change-me")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 60 * 60 * 24  # 24 hours

db.init_app(app)
jwt = JWTManager(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            user_role = claims.get("role")

            if user_role not in allowed_roles:
                return jsonify({"error": "Access denied"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(user_id)

MOCK_PRODUCTS = [
    {
        "name": "Organic Fuji Apples",
        "category": "Fruits",
        "cost": 4.99,
        "weight": 2.0,
        "stock": 50,
        "description": "Crisp, sweet apples from local orchards.",
        "imageUrl": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80",
    },
    {
        "name": "Fresh Blueberries",
        "category": "Fruits",
        "cost": 5.49,
        "weight": 0.75,
        "stock": 30,
        "description": "Plump, antioxidant-rich blueberries.",
        "imageUrl": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80",
    },
    {
        "name": "Heirloom Tomatoes",
        "category": "Vegetables",
        "cost": 3.99,
        "weight": 1.5,
        "stock": 40,
        "description": "Vine-ripened heirloom varieties.",
        "imageUrl": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
    },
    {
        "name": "Baby Spinach",
        "category": "Vegetables",
        "cost": 2.99,
        "weight": 0.5,
        "stock": 60,
        "description": "Tender baby spinach, triple-washed.",
        "imageUrl": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
    },
    {
        "name": "Organic Broccoli",
        "category": "Vegetables",
        "cost": 2.49,
        "weight": 1.25,
        "stock": 45,
        "description": "Locally sourced, no pesticides.",
        "imageUrl": "https://images.unsplash.com/photo-1459411621453-7b03977f4bfc?w=400&q=80",
    },
    {
        "name": "Free-Range Chicken Breast",
        "category": "Meats",
        "cost": 11.99,
        "weight": 2.5,
        "stock": 20,
        "description": "Humanely raised, no hormones.",
        "imageUrl": "https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=80",
    },
    {
        "name": "Grass-Fed Ribeye",
        "category": "Meats",
        "cost": 13.49,
        "weight": 2.0,
        "stock": 15,
        "description": "100% grass-fed, rich in omega-3.",
        "imageUrl": "https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80",
    },
    {
        "name": "Wild Salmon Fillet",
        "category": "Meats",
        "cost": 16.99,
        "weight": 1.5,
        "stock": 12,
        "description": "Alaskan wild-caught, fresh-frozen.",
        "imageUrl": "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
    },
    {
        "name": "Organic Whole Milk",
        "category": "Dairy",
        "cost": 5.29,
        "weight": 8.6,
        "stock": 35,
        "description": "From pasture-raised, local cows.",
        "imageUrl": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
    },
    {
        "name": "Greek Yogurt",
        "category": "Dairy",
        "cost": 4.49,
        "weight": 2.0,
        "stock": 28,
        "description": "Thick, creamy, protein-packed.",
        "imageUrl": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
    },
    {
        "name": "Aged Cheddar",
        "category": "Dairy",
        "cost": 6.99,
        "weight": 1.0,
        "stock": 22,
        "description": "Sharp 12-month aged cheddar block.",
        "imageUrl": "https://images.unsplash.com/photo-1618164435735-413d3b066c9a?w=400&q=80",
    },
    {
        "name": "Sourdough Loaf",
        "category": "Bakery",
        "cost": 7.49,
        "weight": 2.0,
        "stock": 18,
        "description": "Long-fermented, hand-shaped loaf.",
        "imageUrl": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80",
    },
    {
        "name": "Multigrain Rolls",
        "category": "Bakery",
        "cost": 4.99,
        "weight": 1.25,
        "stock": 24,
        "description": "Six-seed blend, baked daily.",
        "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80",
    },
    {
        "name": "Extra Virgin Olive Oil",
        "category": "Pantry",
        "cost": 12.99,
        "weight": 2.5,
        "stock": 30,
        "description": "Cold-pressed, single-origin.",
        "imageUrl": "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80",
    },
    {
        "name": "Organic Brown Rice",
        "category": "Pantry",
        "cost": 3.99,
        "weight": 4.0,
        "stock": 50,
        "description": "Long-grain, whole grain goodness.",
        "imageUrl": "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80",
    },
    {
        "name": "Raw Wildflower Honey",
        "category": "Pantry",
        "cost": 9.49,
        "weight": 1.5,
        "stock": 20,
        "description": "Unfiltered, local wildflower honey.",
        "imageUrl": "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&q=80",
    },
]

@app.route("/change-password", methods=["POST"])
@jwt_required()
def change_password():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not current_password or not new_password:
        return jsonify({"error": "Both current and new passwords are required"}), 400

    if not user.check_password(current_password):
        return jsonify({"error": "Current password is incorrect"}), 400

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Password changed successfully"}), 200


def seed_products():
    for item in MOCK_PRODUCTS:
        existing = Product.query.filter_by(name=item["name"]).first()
        if existing:
            if not existing.image_url:
                existing.image_url = item["imageUrl"]
            continue

        db.session.add(
            Product(
                name=item["name"],
                category=item["category"],
                cost=item["cost"],
                image_url=item["imageUrl"],
                weight=item["weight"],
                stock=item["stock"],
                description=item["description"],
            )
        )

    db.session.commit()

# funct to add image to table 
def run_schema_migrations():
    db.session.execute(
        text("ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR(500)")
    )
    db.session.execute(
        text("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP")
    )
    db.session.execute(
        text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS refund_status VARCHAR(20) DEFAULT 'none'")
    )
    db.session.execute(
        text("ALTER TABLE reports ADD COLUMN IF NOT EXISTS refund_amount FLOAT DEFAULT 0.0")
    )
    db.session.commit()


with app.app_context():
    try:
        db.create_all()
        run_schema_migrations()
        seed_products()
        print("✅ Database tables initialized and products seeded successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

@app.route('/products', methods=['GET'])
@jwt_required()

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

    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={
                "role": user.role.value,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            }
        )

        return jsonify({
            "message": "Login successful",
            "token": access_token,
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
@role_required("employee")
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

@app.route("/geocode")
def geocode():
    address = request.args.get("address")

    if not address:
        return jsonify({"error": "Address required"}), 400

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"

    params = {
        "access_token": os.getenv("MAPBOX_ACCESS_TOKEN"),
        "limit": 1
    }

    res = requests.get(url, params=params)
    data = res.json()

    if not data["features"]:
        return jsonify({"error": "Address not found"}), 404

    feature = data["features"][0]
    lng, lat = feature["center"]

    return jsonify({
        "lat": lat,
        "lng": lng,
        "place_name": feature["place_name"]
    })


@app.route('/orders', methods=['POST'])
@jwt_required()
def create_order():
    DELIVERY_THRESHOLD = 20
    DELIVERY_FEE = 10

    data = request.get_json()

    delivery_info = data.get("deliveryInfo", {})
    items = data.get("items", [])

    if not items:
        return jsonify({"error": "No items in order"}), 400
    
    user_id = get_jwt_identity()

    customer = CustomerProfile.query.filter_by(user_id=user_id).first()

    if not customer:
        return jsonify({"error": "Customer profile not found"}), 400

    customer_id = customer.id

    try:
        subtotal = 0
        total_weight = 0
        order_items = []

        for i in items:
            product = Product.query.get(i["product"]["id"])
            if not product:
                db.session.rollback()
                return jsonify({"error": f"Product with id {i['product']['id']} not found"}), 400   
            if product.stock < i["quantity"]:
                db.session.rollback()
                return jsonify({"error": f"Not enough stock for product {product.name}"}), 400      

            quantity = i["quantity"]
            subtotal += product.cost * quantity
            total_weight += product.weight * quantity
            product.stock -= i["quantity"]

            order_items.append(
                OrderItem(
                    product_id=i["product"]["id"],
                    quantity=quantity,
                    unit_price=product.cost,
                    unit_weight=product.weight
                )
            )

        delivery_fee = 0 if total_weight < DELIVERY_THRESHOLD else DELIVERY_FEE
        tax = float(data.get("tax", 0) or 0)
        total_cost = subtotal + delivery_fee + tax

        # TODO: update the null inputs later with actual data from frontend
        new_order = Order(
            customer_id=customer_id,
            delivery_address=delivery_info.get("addressLine1", ""),
            delivery_city=delivery_info.get("city", ""),
            delivery_zip=delivery_info.get("zipCode", ""),
            subtotal=subtotal,
            total_weight=total_weight,
            delivery_fee=delivery_fee,
            total_cost=total_cost,
            delivery_lat=data.get("delivery_lat", None),
            delivery_lng=data.get("delivery_lng", None),
        )

        db.session.add(new_order)
        db.session.flush()

        for order_item in order_items:
            order_item.order_id = new_order.order_id
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
@role_required("employee")
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
@role_required("employee")
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
@role_required("employee")
def get_active_delivery():
    active_trip = (
        Trip.query.filter(Trip.status.in_(["assigned", "in_progress"]))
        .order_by(Trip.created_at.desc())
        .first()
    )

    if not active_trip:
        return jsonify({"activeDelivery": None}), 200

    if active_trip.status == "in_progress":
        changed = sync_trip_progress(active_trip)
        if changed:
            db.session.commit()

    if active_trip.status == "completed":
        return jsonify({"activeDelivery": None}), 200

    return jsonify(build_active_delivery_from_trip(active_trip)), 200

@app.route("/start-trip/<int:trip_id>", methods=["POST"])
@role_required("employee")
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

from math import radians, sin, cos, sqrt, atan2

def is_near(lng1, lat1, lng2, lat2, threshold_meters=15):
    R = 6371000  # Earth radius in meters

    lat1_r = radians(lat1)
    lat2_r = radians(lat2)
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)

    a = sin(dlat / 2) ** 2 + cos(lat1_r) * cos(lat2_r) * sin(dlng / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance <= threshold_meters

def sync_trip_progress(trip):
    if trip.status != "in_progress" or not trip.started_at or not trip.route_geometry:
        return False

    try:
        route_geometry = json.loads(trip.route_geometry)
    except Exception:
        return False

    coords = route_geometry.get("coordinates", [])
    if not coords:
        return False

    started_at = trip.started_at
    if started_at.tzinfo is not None:
        now = datetime.now(timezone.utc)
    else:
        now = datetime.utcnow()

    elapsed_seconds = max(0, int((now - started_at).total_seconds()))

    # one route point per second
    new_index = min(elapsed_seconds, len(coords) - 1)
    changed = False

    if trip.current_index != new_index:
        trip.current_index = new_index
        trip.current_lng = coords[new_index][0]
        trip.current_lat = coords[new_index][1]
        changed = True

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
                order.delivery_lat,
            )
        ):
            order.status = "delivered"
            changed = True

    if new_index >= len(coords) - 1 and trip.status != "completed":
        trip.status = "completed"
        trip.completed_at = now

        for order in assigned_orders:
            if order.status != "delivered":
                order.status = "delivered"

        changed = True

    return changed

@app.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

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

@app.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "role": user.role.value,
    }), 200


@app.route('/inventory', methods=['GET'])
@role_required("employee")

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
@role_required("employee")
def update_product(product_id):
    product = Product.query.get(product_id)

    if not product:
        return jsonify({"error": "Product not found"}), 404

    try:
        data = request.form
        file = request.files.get("image")

        if file:
            if not file.mimetype.startswith("image/"):
                return jsonify({"error": "Invalid image file"}), 400

            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_name)

            file.save(filepath)
            print("Saving file to:", filepath)

            product.image_url = f"/static/uploads/{unique_name}"

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
                "image_url": product.image_url,
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

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route("/products/<int:product_id>", methods=["DELETE"])
@role_required("employee")

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
@role_required("employee")
def create_product():
    try:
        data = request.form
        file = request.files.get("image")

        image_url = None

        if file:
            if not file.mimetype.startswith("image/"):
                return jsonify({"error": "Invalid image file"}), 400

            filename = secure_filename(file.filename)
            unique_name = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(UPLOAD_FOLDER, unique_name)

            file.save(filepath)
            print("Saving file to:", filepath)

            image_url = f"/static/uploads/{unique_name}"

        new_product = Product(
            name=data.get("name"),
            description=data.get("description", ""),
            weight=float(data.get("weight", 0)),
            cost=float(data.get("price", 0)),
            category=data.get("category"),
            stock=int(data.get("quantity", 0)),
            image_url=image_url,  
        )

        db.session.add(new_product)
        db.session.commit()

        return jsonify({
            "message": "Product created successfully",
            "id": new_product.product_id,
            "image_url": image_url
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

@app.route('/orders/<int:order_id>', methods=['GET'])
def get_order_details(order_id):
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({"error": "Order not found"}), 404
    
    return jsonify({
        "order_id": order.order_id,
        "ordered_at": order.ordered_at.isoformat() if order.ordered_at else None,
        "total_cost": order.total_cost,
        "subtotal": order.subtotal,
        "delivery_fee": order.delivery_fee,
        "status": order.status,
        "delivery_address": order.delivery_address,
        "delivery_city": order.delivery_city,
        "delivery_state": order.delivery_state,
        "delivery_zip": order.delivery_zip,
        "items": [
            {
                "product": {
                    "id": item.product.product_id,
                    "name": item.product.name,
                    "category": item.product.category,
                    "price": item.product.cost,
                    "weight": item.product.weight,
                    "stock": item.product.stock,
                    "description": item.product.description,
                    "imageUrl": item.product.image_url or ""
                },
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "unit_weight": item.unit_weight,
                "subtotal": item.quantity * item.unit_price
            }
            for item in order.order_items
        ]
    }), 200

@app.route('/orders/history', methods=['GET'])
@role_required("customer")
def get_order_history():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.customer_profile:
        return jsonify({"error": "Only customers have order history"}), 403

    orders = (
        Order.query
        .filter(Order.customer_id == user.customer_profile.id)
        .order_by(Order.ordered_at.desc())
        .all()
    )

    return jsonify([
        {
            "order_id": o.order_id,
            "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
            "total_cost": o.total_cost,
            "status": o.status,
            "item_count": len(o.order_items),
            "delivery_address": o.delivery_address,
            "total_weight": o.total_weight,
        }
        for o in orders
    ]), 200


@app.route('/orders/active', methods=['GET'])
@role_required("customer")
def get_active_orders():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    if not user.customer_profile:
        return jsonify({"error": "Only customers can view active orders"}), 403

    active_statuses = ["pending", "assigned", "in_progress"]

    orders = (
        Order.query
        .filter(
            Order.customer_id == user.customer_profile.id,
            Order.status.in_(active_statuses)
        )
        .order_by(Order.ordered_at.desc())
        .all()
    )

    touched_trip_ids = set()

    for o in orders:
        trip = o.trip
        if trip and trip.status == "in_progress" and trip.trip_id not in touched_trip_ids:
            sync_trip_progress(trip)
            touched_trip_ids.add(trip.trip_id)

    if touched_trip_ids:
        db.session.commit()

    # re-query in case some orders became delivered and dropped out of active list
    orders = (
        Order.query
        .filter(
            Order.customer_id == user.customer_profile.id,
            Order.status.in_(active_statuses)
        )
        .order_by(Order.ordered_at.desc())
        .all()
    )

    results = []

    for o in orders:
        trip = o.trip

        route_geometry = None
        traveled_path = None
        robot_position = None
        trip_status = None
        trip_id = None
        map_points = []

        if trip:
            trip_status = trip.status
            trip_id = trip.trip_id

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

            robot_position = (
                {
                    "lng": trip.current_lng,
                    "lat": trip.current_lat,
                }
                if trip.current_lng is not None and trip.current_lat is not None
                else None
            )

            assigned_orders = (
                Order.query.filter(Order.trip_id == trip.trip_id)
                .order_by(Order.order_id.asc())
                .all()
            )

            for i, order in enumerate(assigned_orders, start=1):
                if order.delivery_lat is None or order.delivery_lng is None:
                    continue

                map_points.append({
                    "lng": order.delivery_lng,
                    "lat": order.delivery_lat,
                    "label": str(i),
                    "completed": order.status == "delivered",
                })

        results.append({
            "order_id": o.order_id,
            "ordered_at": o.ordered_at.isoformat() if o.ordered_at else None,
            "total_cost": o.total_cost,
            "status": o.status,
            "item_count": len(o.order_items),
            "delivery_address": o.delivery_address,
            "total_weight": o.total_weight,
            "tripId": f"Trip #{trip_id}" if trip_id else None,
            "tripStatus": trip_status,
            "routeGeometry": route_geometry,
            "traveledPath": traveled_path,
            "robotPosition": robot_position,
            "mapPoints": map_points,
            "eta": round(trip.estimated_time or 0) if trip else None,
        })

    return jsonify(results), 200



@app.route('/reports', methods=['POST'])
@role_required("customer")
def create_report():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.customer_profile:
        return jsonify({"error": "Customer profile not found"}), 404

    data = request.get_json(silent=True) or {}

    order_id = data.get('order_id')
    report_type = (data.get('report_type') or '').strip()
    description = (data.get('description') or '').strip()

    if not all([order_id, report_type, description]):
        return jsonify({"error": "Missing required fields"}), 400

    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    if order.customer_id != user.customer_profile.id:
        return jsonify({"error": "Order does not belong to this customer"}), 403

    report = Report(
        order_id=order_id,
        customer_id=user.customer_profile.id,
        report_type=report_type,
        description=description,
        status="open",
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({"message": "Report submitted successfully", "report_id": report.report_id}), 201

@app.route('/reports', methods=['GET'])
@role_required("employee")
def get_reports():
    reports = Report.query.order_by(Report.created_at.desc()).all()

    def serialize(r):
        customer_name = None
        if r.customer and r.customer.user:
            u = r.customer.user
            customer_name = f"{u.first_name} {u.last_name}"
        order_total = r.order.total_cost if r.order else None
        msgs = r.messages or []
        return {
            "report_id": r.report_id,
            "order_id": r.order_id,
            "customer_id": r.customer_id,
            "customer_name": customer_name,
            "report_type": r.report_type,
            "description": r.description,
            "status": r.status,
            "refund_status": r.refund_status or "none",
            "refund_amount": r.refund_amount or 0.0,
            "order_total": order_total,
            "message_count": len(msgs),
            "last_message_role": msgs[-1].sender_role if msgs else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }

    return jsonify([serialize(r) for r in reports]), 200


@app.route('/reports/mine', methods=['GET'])
@role_required("customer")
def get_my_reports():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user or not user.customer_profile:
        return jsonify({"error": "Customer profile not found"}), 404

    reports = (
        Report.query
        .filter_by(customer_id=user.customer_profile.id)
        .order_by(Report.created_at.desc())
        .all()
    )

    return jsonify([
        {
            "report_id": r.report_id,
            "order_id": r.order_id,
            "report_type": r.report_type,
            "description": r.description,
            "status": r.status,
            "refund_status": r.refund_status or "none",
            "refund_amount": r.refund_amount or 0.0,
            "order_total": r.order.total_cost if r.order else None,
            "message_count": len(r.messages or []),
            "last_message_role": r.messages[-1].sender_role if r.messages else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]), 200


@app.route('/reports/<int:report_id>/refund', methods=['POST'])
@role_required("employee")
def issue_refund(report_id):
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    refund_type = data.get('refund_type', 'full')   # "full" or "partial"
    amount = data.get('amount')

    order = report.order
    if not order:
        return jsonify({"error": "Associated order not found"}), 404

    if refund_type == 'full':
        refund_amount = order.total_cost
        report.refund_status = 'full'
    else:
        if amount is None or float(amount) <= 0:
            return jsonify({"error": "A positive amount is required for partial refunds"}), 400
        refund_amount = round(float(amount), 2)
        report.refund_status = 'partial'

    report.refund_amount = refund_amount

    # Mark payment as refunded if it exists
    if order.payment:
        order.payment.payment_status = 'refunded'

    db.session.commit()

    return jsonify({
        "message": "Refund issued successfully",
        "refund_amount": refund_amount,
        "refund_status": report.refund_status,
    }), 200


@app.route('/reports/<int:report_id>/messages', methods=['GET'])
@jwt_required()
def get_report_messages(report_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    report = Report.query.get(report_id)

    if not report:
        return jsonify({"error": "Report not found"}), 404

    if user.role.value == "customer":
        if not user.customer_profile or report.customer_id != user.customer_profile.id:
            return jsonify({"error": "Access denied"}), 403

    messages = (
        ReportMessage.query
        .filter_by(report_id=report_id)
        .order_by(ReportMessage.created_at.asc())
        .all()
    )

    return jsonify([
        {
            "message_id": m.message_id,
            "sender_role": m.sender_role,
            "sender_name": m.sender_name,
            "message": m.message,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        }
        for m in messages
    ]), 200


@app.route('/reports/<int:report_id>/messages', methods=['POST'])
@jwt_required()
def send_report_message(report_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    report = Report.query.get(report_id)

    if not report:
        return jsonify({"error": "Report not found"}), 404

    if user.role.value == "customer":
        if not user.customer_profile or report.customer_id != user.customer_profile.id:
            return jsonify({"error": "Access denied"}), 403
    elif user.role.value != "employee":
        return jsonify({"error": "Access denied"}), 403

    data = request.get_json(silent=True) or {}
    text_body = (data.get('message') or '').strip()
    if not text_body:
        return jsonify({"error": "Message cannot be empty"}), 400

    sender_name = f"{user.first_name} {user.last_name}"

    msg = ReportMessage(
        report_id=report_id,
        sender_role=user.role.value,
        sender_name=sender_name,
        message=text_body,
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({
        "message_id": msg.message_id,
        "sender_role": msg.sender_role,
        "sender_name": msg.sender_name,
        "message": msg.message,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }), 201


@app.route('/orders/<int:order_id>/items', methods=['GET'])
@role_required("employee")
def get_order_items(order_id):
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404

    return jsonify([
        {
            "order_item_id": item.order_item_id,
            "product_id": item.product_id,
            "name": item.product.name if item.product else f"Product #{item.product_id}",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "line_total": round(item.unit_price * item.quantity, 2),
        }
        for item in order.order_items
    ]), 200


@app.route('/reports/<int:report_id>', methods=['PUT'])
@role_required("employee")
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


@app.route('/orders/all', methods=['GET'])
@role_required("employee")
def get_all_orders():
    orders = (
        Order.query
        .order_by(Order.ordered_at.desc())
        .all()
    )

    results = []

    for o in orders:
        # get customer + user info
        customer = CustomerProfile.query.get(o.customer_id)
        user = User.query.get(customer.user_id) if customer else None

        customer_name = (
            f"{user.first_name} {user.last_name}"
            if user else f"Customer #{o.customer_id}"
        )

        results.append({
            "id": o.order_id,
            "label": f"Order #{o.order_id}",
            "customerId": o.customer_id,
            "customerName": customer_name,

            "weight": o.total_weight,
            "address": o.delivery_address,
            "city": o.delivery_city,
            "state": o.delivery_state,
            "zip": o.delivery_zip,

            "price": o.total_cost,
            "lat": o.delivery_lat,
            "lng": o.delivery_lng,

            "status": o.status,

            "orderedAt": o.ordered_at.isoformat() if o.ordered_at else None,

            "completedAt": (
                o.updated_at.isoformat()
                if o.status == "delivered" and o.updated_at
                else None
            ),
        })

    return jsonify(results), 200

@app.route("/cancel-route/<int:trip_id>", methods=["POST"])
@role_required("employee")
def cancel_route(trip_id):
    trip = Trip.query.get(trip_id)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    if trip.status == "completed":
        return jsonify({"error": "Completed trips cannot be cancelled"}), 400

    assigned_orders = Order.query.filter_by(trip_id=trip.trip_id).all()

    for order in assigned_orders:
        order.trip_id = None

        if order.status != "delivered":
            order.status = "pending"

    trip.status = "cancelled"

    db.session.commit()

    return jsonify({"message": "Route cancelled successfully"}), 200


# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

