from datetime import datetime, timezone
import uuid
import enum

from database import db
from sqlalchemy import Enum
from werkzeug.security import generate_password_hash, check_password_hash

class UserRole(enum.Enum):
    CUSTOMER = "customer"
    EMPLOYEE = "employee"


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    role = db.Column(Enum(UserRole), default=UserRole.CUSTOMER, nullable=False)

    customer_profile = db.relationship('CustomerProfile', backref='user', uselist=False)
    employee_profile = db.relationship('EmployeeProfile', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class CustomerProfile(db.Model):
    __tablename__ = 'customer_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    delivery_address = db.Column(db.String(255), nullable=False)


class EmployeeProfile(db.Model):
    __tablename__ = 'employee_profiles'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)

    employee_code = db.Column(db.String(50), unique=True, nullable=False)


class Product(db.Model):
    __tablename__ = "products"

    product_id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    weight = db.Column(db.Float, nullable=False)
    cost = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100))
    stock = db.Column(db.Integer, default=0)

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    order_items = db.relationship("OrderItem", backref="product", lazy=True)


class Trip(db.Model):
    __tablename__ = "trips"

    trip_id = db.Column(db.Integer, primary_key=True)

    employee_id = db.Column(db.Integer, db.ForeignKey("employee_profiles.id"))

    departure_time = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    status = db.Column(db.String(50))

    total_weight = db.Column(db.Float)
    total_orders = db.Column(db.Integer)
    estimated_time = db.Column(db.Float)
    total_distance = db.Column(db.Float)
    current_index = db.Column(db.Integer, default=0)
    current_lat = db.Column(db.Float, nullable=True)
    current_lng = db.Column(db.Float, nullable=True)
    started_at = db.Column(db.DateTime, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    route_geometry = db.Column(db.Text)

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    orders = db.relationship("Order", backref="trip", lazy=True)


class Order(db.Model):
    __tablename__ = "orders"

    order_id = db.Column(db.Integer, primary_key=True)

    customer_id = db.Column(db.Integer, db.ForeignKey("customer_profiles.id"), nullable=False)
    trip_id = db.Column(db.Integer, db.ForeignKey("trips.trip_id"))

    delivery_address = db.Column(db.String(255), nullable=False)
    delivery_city = db.Column(db.String(100))
    delivery_state = db.Column(db.String(50))
    delivery_zip = db.Column(db.String(20))

    delivery_lat = db.Column(db.Float)
    delivery_lng = db.Column(db.Float)

    subtotal = db.Column(db.Float, nullable=False)
    total_weight = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, default=0)
    total_cost = db.Column(db.Float, nullable=False)

    status = db.Column(db.String(50), default="pending")

    cancelled_at = db.Column(db.DateTime)
    cancel_reason = db.Column(db.String(255))

    ordered_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), onupdate=lambda: datetime.now(timezone.utc))

    order_items = db.relationship("OrderItem", backref="order", lazy=True)
    payment = db.relationship("Payment", backref="order", uselist=False)


class OrderItem(db.Model):
    __tablename__ = "order_items"

    order_item_id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("products.product_id"), nullable=False)

    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    unit_weight = db.Column(db.Float, nullable=False)


class Payment(db.Model):
    __tablename__ = "payments"

    payment_id = db.Column(db.Integer, primary_key=True)

    order_id = db.Column(db.Integer, db.ForeignKey("orders.order_id"), nullable=False)

    payment_method = db.Column(db.String(50))
    payment_status = db.Column(db.String(50))
    currency = db.Column(db.String(10), default="USD")

    paid_amount = db.Column(db.Float)
    paid_at = db.Column(db.DateTime)

    stripe_session_id = db.Column(db.String(255))
    payment_intent_id = db.Column(db.String(255))

    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))