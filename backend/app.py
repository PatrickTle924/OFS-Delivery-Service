# flask file

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import uuid
import enum
from sqlalchemy import Enum
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app) # Allow Next.js to communicate with Flask
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@db:5432/delivery_db'
db = SQLAlchemy(app)

# Classes
class UserRole(enum.Enum):
    CUSTOMER = "customer"
    EMPLOYEE = "employee"

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # regular comlumns based on the frontend
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # define functions for handling auth and passwords
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    # Add the Role column with a default val
    role = db.Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False) # fixed to use actual role enum

    # relations to the other tables
    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False)
    employee_profile = db.relationship('EmployeeProfile', backref='user', uselist=False)

# separate role based tables, extend base User model with extra fields
class CustomerProfile(db.Model):
    __tablename__ = 'customer_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    delivery_address = db.Column(db.String(255), nullable=False)

class EmployeeProfile(db.Model):
    __tablename__ = 'employee_profiles'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    employee_id = db.Column(db.String(50), unique=True, nullable=False)


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    customer_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')


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

# initial tables creation on startup
with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables initialized successfully.")
    except Exception as e:
        print(f"❌ Error initializing database: {e}")

# for local development without Docker
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)