# flask file

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
import enum
from sqlalchemy import Enum
from models import User, UserRole, CustomerProfile, EmployeeProfile, Order, Product
from database import db

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost:5432/delivery_db'

# Connect the db instance to our flask app
db.init_app(app)

with app.app_context():
    db.create_all()

# API ROUTES
@app.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([{"id": o.id, "customerName": o.customer_name, "status": o.status} for o in orders])

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
        return jsonify({"message": "Login successful", "user": user.first_name}), 200
        
    return jsonify({"error": "Invalid credentials"}), 401

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

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "message": "Backend is running"
    }), 200

# initial tables creation on startup
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)