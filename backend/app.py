# flask file

import os

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
import enum
from sqlalchemy import Enum
from models import User, UserRole, CustomerProfile, EmployeeProfile, Order
from database import db
import time
import requests

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@db:5432/delivery_db'

# Connect the db instance to our flask app
db.init_app(app)


MAPBOX_ACCESS_TOKEN = os.getenv("MAPBOX_ACCESS_TOKEN")

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
    if requested_role == 'customer':
        profile = CustomerProfile(user_id=new_user.id, delivery_address=data.get('deliveryAddress', ''))
        db.session.add(profile)
    elif requested_role == 'employee':
        profile = EmployeeProfile(
            user_id=new_user.id,
            employee_code=data.get('employeeCode', '')
        )
        db.session.add(profile)

    db.session.commit()
    
    return jsonify({"message": "User created successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()

    if user and user.check_password(data['password']):
        return jsonify({
            "message": "Login successful",
            "user": {
                "firstName": user.first_name,
                "role": user.role.value
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
def build_v1_coordinates(selected_orders):
    """
    Build the semicolon-separated coordinate list for Optimization API v1.

    We put the warehouse first, and use roundtrip=true with source=first,
    so the route starts and ends at the warehouse.
    """
    coords = [f"{WAREHOUSE['coordinates'][0]},{WAREHOUSE['coordinates'][1]}"]

    for order in selected_orders:
        coords.append(f"{order.delivery_lng},{order.delivery_lat}")

    return ";".join(coords)


def transform_v1_solution_for_frontend(selected_orders, solution):
    """
    Convert Mapbox Optimization v1 response into the shape your frontend expects.
    """
    trips = solution.get("trips", [])
    waypoints = solution.get("waypoints", [])

    if not trips:
        return {
            "activeDelivery": None,
            "suggestedRoutes": []
        }

    trip = trips[0]

    # Build lookup from original coordinate index -> order
    # index 0 is warehouse, so orders start at index 1
    order_by_input_index = {
        index + 1: order for index, order in enumerate(selected_orders)
    }

    # Mapbox returns waypoints in input order, but each waypoint has waypoint_index
    # which tells us its position in the optimized trip.
    optimized_order_entries = []

    for waypoint_input_index, waypoint in enumerate(waypoints):
        if waypoint_input_index == 0:
            # skip warehouse
            continue

        optimized_position = waypoint.get("waypoint_index")
        order = order_by_input_index.get(waypoint_input_index)

        if order is None or optimized_position is None:
            continue

        optimized_order_entries.append({
            "optimized_position": optimized_position,
            "order": order
        })

    # Sort by optimized trip order
    optimized_order_entries.sort(key=lambda x: x["optimized_position"])

    route_stops = []
    map_points = []

    for i, entry in enumerate(optimized_order_entries, start=1):
        order = entry["order"]

        route_stops.append({
            "label": str(i),
            "address": order.delivery_address
        })

        map_points.append({
            "lng": order.delivery_lng,
            "lat": order.delivery_lat,
            "label": str(i)
        })

    map_lines = []
    for i in range(len(map_points) - 1):
        map_lines.append({
            "from": i,
            "to": i + 1
        })

    total_distance_km = round((trip.get("distance", 0) or 0) / 1000, 1)
    estimated_time_min = round((trip.get("duration", 0) or 0) / 60)

    suggested_route = {
        "id": 1,
        "title": "Optimized Route",
        "subtitle": "Mapbox Optimization v1",
        "estimatedTime": estimated_time_min,
        "totalDistance": total_distance_km,
        "stops": route_stops
    }

    active_delivery = {
        "tripId": "Trip #203",
        "robotId": "Robot-01",
        "eta": estimated_time_min,
        "mapPoints": map_points,
        "mapLines": map_lines,
        "routeGeometry": trip.get("geometry")
    }

    return {
        "activeDelivery": active_delivery,
        "suggestedRoutes": [suggested_route]
    }


@app.route('/optimize-routes', methods=['POST'])
def optimize_routes():
    data = request.get_json()
    selected_order_ids = data.get("orderIds", [])

    if not selected_order_ids:
        return jsonify({"error": "No orders selected"}), 400

    selected_orders = Order.query.filter(
        Order.order_id.in_(selected_order_ids)
    ).all()

    if not selected_orders:
        return jsonify({"error": "No matching orders found"}), 404

    missing_coords = [
        o.order_id for o in selected_orders
        if o.delivery_lat is None or o.delivery_lng is None
    ]
    if missing_coords:
        return jsonify({
            "error": "Some selected orders are missing coordinates",
            "orderIds": missing_coords
        }), 400

    if not MAPBOX_ACCESS_TOKEN:
        return jsonify({"error": "MAPBOX_ACCESS_TOKEN is not configured"}), 500

    # v1 limit: max 12 coordinates total
    # 1 warehouse + up to 11 selected orders
    if len(selected_orders) > 11:
        return jsonify({
            "error": "Optimization v1 supports at most 11 selected orders at a time"
        }), 400

    coordinates = build_v1_coordinates(selected_orders)

    url = (
        f"https://api.mapbox.com/optimized-trips/v1/"
        f"mapbox/driving/{coordinates}"
    )

    params = {
        "access_token": MAPBOX_ACCESS_TOKEN,
        "source": "first",
        "roundtrip": "true",
        "geometries": "geojson",
        "overview": "full",
        "steps": "false"
    }

    resp = requests.get(url, params=params, timeout=30)

    if resp.status_code != 200:
        return jsonify({
            "error": "Failed to retrieve optimization",
            "details": resp.text
        }), 500

    solution = resp.json()

    if solution.get("code") != "Ok":
        return jsonify({
            "error": "Mapbox optimization failed",
            "details": solution
        }), 400

    return jsonify(transform_v1_solution_for_frontend(selected_orders, solution)), 200


# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
 
