# flask file

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
import enum
import os
from sqlalchemy import text
from sqlalchemy import Enum
from models import User, UserRole, CustomerProfile, EmployeeProfile, Order, Product
from database import db

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://user:password@db:5432/delivery_db')

# Connect the db instance to our flask app
db.init_app(app)

with app.app_context():
    db.create_all()


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
    db.session.commit()


with app.app_context():
    try:
        db.create_all()
        run_schema_migrations()
        seed_products()
        print("✅ Database tables initialized and products seeded successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

# API ROUTES
@app.route('/orders', methods=['GET'])
def get_orders():
    orders = Order.query.all()
    return jsonify([{"id": o.id, "customerName": o.customer_name, "status": o.status} for o in orders])


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

# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
