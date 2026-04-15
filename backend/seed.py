from datetime import datetime, timezone, timedelta

from app import app
from database import db
from models import (
    User,
    UserRole,
    CustomerProfile,
    EmployeeProfile,
    Product,
    Trip,
    Order,
    OrderItem,
    Payment,
)


def seed_all():
    with app.app_context():
        print("Starting seed...")
        # Optional: wipe existing data in dependency order
        Payment.query.delete()
        OrderItem.query.delete()
        Order.query.delete()
        Trip.query.delete()
        Product.query.delete()
        EmployeeProfile.query.delete()
        CustomerProfile.query.delete()
        User.query.delete()
        db.session.commit()

        # -------------------
        # Users
        # -------------------
        customer_users = [
            {
                "first_name": "Alice",
                "last_name": "Nguyen",
                "email": "alice@example.com",
                "phone_number": "408-555-0101",
                "password": "password123",
            },
            {
                "first_name": "Brian",
                "last_name": "Lee",
                "email": "brian@example.com",
                "phone_number": "408-555-0102",
                "password": "password123",
            },
            {
                "first_name": "Carla",
                "last_name": "Patel",
                "email": "carla@example.com",
                "phone_number": "408-555-0103",
                "password": "password123",
            },
            {
                "first_name": "David",
                "last_name": "Garcia",
                "email": "david@example.com",
                "phone_number": "408-555-0104",
                "password": "password123",
            },
        ]

        employee_users = [
            {
                "first_name": "Leo",
                "last_name": "Garcia",
                "email": "leo.employee@example.com",
                "phone_number": "408-555-0201",
                "password": "password123",
                "employee_code": "EMP001",
            },
            {
                "first_name": "Maya",
                "last_name": "Chen",
                "email": "maya.employee@example.com",
                "phone_number": "408-555-0202",
                "password": "password123",
                "employee_code": "EMP002",
            },
        ]

        created_customers = []
        created_employees = []

        for c in customer_users:
            user = User(
                first_name=c["first_name"],
                last_name=c["last_name"],
                email=c["email"],
                phone_number=c["phone_number"],
                role=UserRole.CUSTOMER,
            )
            user.set_password(c["password"])
            db.session.add(user)
            db.session.flush()

            profile = CustomerProfile(
                user_id=user.id,
                delivery_address=f"{c['first_name']} Residence, San Jose, CA"
            )
            db.session.add(profile)
            db.session.flush()

            created_customers.append({"user": user, "profile": profile})

        for e in employee_users:
            user = User(
                first_name=e["first_name"],
                last_name=e["last_name"],
                email=e["email"],
                phone_number=e["phone_number"],
                role=UserRole.EMPLOYEE,
            )
            user.set_password(e["password"])
            db.session.add(user)
            db.session.flush()

            profile = EmployeeProfile(
                user_id=user.id,
                employee_id=e["employee_code"],
            )
            db.session.add(profile)
            db.session.flush()

            created_employees.append({"user": user, "profile": profile})

        # -------------------
        # Products
        # -------------------
        products_data = [
            {
                "name": "Organic Fuji Apples",
                "description": "Crisp and sweet apples from local orchards.",
                "weight": 2.0,
                "cost": 4.99,
                "image_url": "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=80",
                "category": "Fruits",
                "stock": 50,
            },
            {
                "name": "Fresh Blueberries",
                "description": "Antioxidant-rich blueberries.",
                "weight": 0.75,
                "cost": 5.49,
                "image_url": "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=400&q=80",
                "category": "Fruits",
                "stock": 30,
            },
            {
                "name": "Heirloom Tomatoes",
                "description": "Vine-ripened heirloom tomatoes.",
                "weight": 1.5,
                "cost": 3.99,
                "image_url": "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400&q=80",
                "category": "Vegetables",
                "stock": 40,
            },
            {
                "name": "Baby Spinach",
                "description": "Triple-washed fresh spinach.",
                "weight": 0.5,
                "cost": 2.99,
                "image_url": "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
                "category": "Vegetables",
                "stock": 60,
            },
            {
                "name": "Whole Milk",
                "description": "Organic whole milk gallon.",
                "weight": 8.6,
                "cost": 5.29,
                "image_url": "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80",
                "category": "Dairy",
                "stock": 25,
            },
            {
                "name": "Sourdough Loaf",
                "description": "Freshly baked sourdough loaf.",
                "weight": 1.8,
                "cost": 6.49,
                "image_url": "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=400&q=80",
                "category": "Bakery",
                "stock": 20,
            },
        ]

        created_products = []
        for p in products_data:
            product = Product(**p)
            db.session.add(product)
            db.session.flush()
            created_products.append(product)

        # -------------------
        # Trips
        # -------------------
        now = datetime.now(timezone.utc)

        trip_1 = Trip(
            employee_id=created_employees[0]["profile"].id,
            departure_time=now - timedelta(hours=2),
            started_at=now - timedelta(hours=2),
            completed_at=None,
            status="in_progress",
            total_weight=35.75,
            total_orders=2,
            estimated_time=95.0,
            total_distance=18.4,
            current_index=1,
            current_lat=37.3382,
            current_lng=-121.8863,
            route_geometry='{"type":"LineString","coordinates":[[-121.8863,37.3382],[-121.8965,37.3480],[-121.9050,37.3320]]}',
            created_at=now - timedelta(hours=3),
        )
        db.session.add(trip_1)
        db.session.flush()

        trip_2 = Trip(
            employee_id=created_employees[1]["profile"].id,
            departure_time=now - timedelta(days=1, hours=3),
            started_at=now - timedelta(days=1, hours=3),
            completed_at=now - timedelta(days=1, hours=1, minutes=20),
            status="completed",
            total_weight=28.20,
            total_orders=2,
            estimated_time=80.0,
            total_distance=14.6,
            current_index=2,
            current_lat=37.3340,
            current_lng=-121.8760,
            route_geometry='{"type":"LineString","coordinates":[[-121.8760,37.3340],[-121.8860,37.3400],[-121.8950,37.3450]]}',
            created_at=now - timedelta(days=1, hours=4),
        )
        db.session.add(trip_2)
        db.session.flush()

        # -------------------
        # Orders
        # -------------------
        orders_data = [
            {
                "customer_profile": created_customers[0]["profile"],
                "trip_id": trip_1.trip_id,
                "delivery_address": "123 South St",
                "delivery_city": "San Jose",
                "delivery_state": "CA",
                "delivery_zip": "95112",
                "delivery_lat": 37.3382,
                "delivery_lng": -121.8863,
                "subtotal": 24.95,
                "total_weight": 4.75,
                "delivery_fee": 5.00,
                "total_cost": 29.95,
                "status": "out_for_delivery",
                "ordered_at": now - timedelta(hours=5),
            },
            {
                "customer_profile": created_customers[1]["profile"],
                "trip_id": trip_1.trip_id,
                "delivery_address": "456 North St",
                "delivery_city": "San Jose",
                "delivery_state": "CA",
                "delivery_zip": "95110",
                "delivery_lat": 37.3480,
                "delivery_lng": -121.8965,
                "subtotal": 31.46,
                "total_weight": 7.20,
                "delivery_fee": 5.00,
                "total_cost": 36.46,
                "status": "packed",
                "ordered_at": now - timedelta(hours=4, minutes=30),
            },
            {
                "customer_profile": created_customers[2]["profile"],
                "trip_id": trip_2.trip_id,
                "delivery_address": "789 East St",
                "delivery_city": "San Jose",
                "delivery_state": "CA",
                "delivery_zip": "95116",
                "delivery_lat": 37.3340,
                "delivery_lng": -121.8760,
                "subtotal": 18.96,
                "total_weight": 3.25,
                "delivery_fee": 4.50,
                "total_cost": 23.46,
                "status": "delivered",
                "ordered_at": now - timedelta(days=1, hours=6),
            },
            {
                "customer_profile": created_customers[3]["profile"],
                "trip_id": trip_2.trip_id,
                "delivery_address": "321 West St",
                "delivery_city": "San Jose",
                "delivery_state": "CA",
                "delivery_zip": "95126",
                "delivery_lat": 37.3320,
                "delivery_lng": -121.9050,
                "subtotal": 14.47,
                "total_weight": 2.80,
                "delivery_fee": 4.50,
                "total_cost": 18.97,
                "status": "delivered",
                "ordered_at": now - timedelta(days=1, hours=5, minutes=15),
            },
        ]

        created_orders = []
        for o in orders_data:
            order = Order(
                customer_id=o["customer_profile"].id,
                trip_id=o["trip_id"],
                delivery_address=o["delivery_address"],
                delivery_city=o["delivery_city"],
                delivery_state=o["delivery_state"],
                delivery_zip=o["delivery_zip"],
                delivery_lat=o["delivery_lat"],
                delivery_lng=o["delivery_lng"],
                subtotal=o["subtotal"],
                total_weight=o["total_weight"],
                delivery_fee=o["delivery_fee"],
                total_cost=o["total_cost"],
                status=o["status"],
                ordered_at=o["ordered_at"],
            )
            db.session.add(order)
            db.session.flush()
            created_orders.append(order)

        # -------------------
        # Order Items
        # -------------------
        order_items_data = [
            # Order 1
            {"order": created_orders[0], "product": created_products[0], "quantity": 2},
            {"order": created_orders[0], "product": created_products[3], "quantity": 3},
            {"order": created_orders[0], "product": created_products[5], "quantity": 1},

            # Order 2
            {"order": created_orders[1], "product": created_products[1], "quantity": 2},
            {"order": created_orders[1], "product": created_products[2], "quantity": 4},
            {"order": created_orders[1], "product": created_products[4], "quantity": 1},

            # Order 3
            {"order": created_orders[2], "product": created_products[0], "quantity": 1},
            {"order": created_orders[2], "product": created_products[5], "quantity": 2},

            # Order 4
            {"order": created_orders[3], "product": created_products[2], "quantity": 2},
            {"order": created_orders[3], "product": created_products[3], "quantity": 1},
            {"order": created_orders[3], "product": created_products[4], "quantity": 1},
        ]

        for item in order_items_data:
            order_item = OrderItem(
                order_id=item["order"].order_id,
                product_id=item["product"].product_id,
                quantity=item["quantity"],
                unit_price=item["product"].cost,
                unit_weight=item["product"].weight,
            )
            db.session.add(order_item)

        # -------------------
        # Payments
        # -------------------
        payments_data = [
            {
                "order": created_orders[0],
                "payment_method": "card",
                "payment_status": "paid",
                "currency": "USD",
                "paid_amount": created_orders[0].total_cost,
                "paid_at": now - timedelta(hours=4, minutes=50),
                "stripe_session_id": "cs_test_001",
                "payment_intent_id": "pi_test_001",
            },
            {
                "order": created_orders[1],
                "payment_method": "card",
                "payment_status": "paid",
                "currency": "USD",
                "paid_amount": created_orders[1].total_cost,
                "paid_at": now - timedelta(hours=4, minutes=10),
                "stripe_session_id": "cs_test_002",
                "payment_intent_id": "pi_test_002",
            },
            {
                "order": created_orders[2],
                "payment_method": "apple_pay",
                "payment_status": "paid",
                "currency": "USD",
                "paid_amount": created_orders[2].total_cost,
                "paid_at": now - timedelta(days=1, hours=5, minutes=40),
                "stripe_session_id": "cs_test_003",
                "payment_intent_id": "pi_test_003",
            },
            {
                "order": created_orders[3],
                "payment_method": "card",
                "payment_status": "paid",
                "currency": "USD",
                "paid_amount": created_orders[3].total_cost,
                "paid_at": now - timedelta(days=1, hours=4, minutes=50),
                "stripe_session_id": "cs_test_004",
                "payment_intent_id": "pi_test_004",
            },
        ]

        for p in payments_data:
            payment = Payment(
                order_id=p["order"].order_id,
                payment_method=p["payment_method"],
                payment_status=p["payment_status"],
                currency=p["currency"],
                paid_amount=p["paid_amount"],
                paid_at=p["paid_at"],
                stripe_session_id=p["stripe_session_id"],
                payment_intent_id=p["payment_intent_id"],
            )
            db.session.add(payment)

        db.session.commit()
        print("Seeded customers and orders successfully.")
        print("Seeded all tables successfully.")


if __name__ == "__main__":
    seed_all()