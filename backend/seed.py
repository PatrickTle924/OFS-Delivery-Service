from app import app
from database import db
from models import User, UserRole, CustomerProfile, Order

CUSTOMERS = [
    {
        "first_name": "Alice",
        "last_name": "Nguyen",
        "email": "alice@example.com",
        "phone": "408-555-0101",
        "password": "password123",
        "delivery_address": "123 South St",
        "delivery_city": "San Jose",
        "delivery_state": "CA",
        "delivery_zip": "95112",
        "delivery_lat": 37.3382,
        "delivery_lng": -121.8863,
        "subtotal": 64.20,
        "total_weight": 18.0,
        "delivery_fee": 6.00,
        "total_cost": 70.20
    },
    {
        "first_name": "Brian",
        "last_name": "Lee",
        "email": "brian@example.com",
        "phone": "408-555-0102",
        "password": "password123",
        "delivery_address": "456 North St",
        "delivery_city": "San Jose",
        "delivery_state": "CA",
        "delivery_zip": "95110",
        "delivery_lat": 37.3480,
        "delivery_lng": -121.8965,
        "subtotal": 45.20,
        "total_weight": 17.0,
        "delivery_fee": 5.00,
        "total_cost": 50.20
    },
    {
        "first_name": "Carla",
        "last_name": "Patel",
        "email": "carla@example.com",
        "phone": "408-555-0103",
        "password": "password123",
        "delivery_address": "789 East St",
        "delivery_city": "San Jose",
        "delivery_state": "CA",
        "delivery_zip": "95116",
        "delivery_lat": 37.3340,
        "delivery_lng": -121.8760,
        "subtotal": 55.20,
        "total_weight": 16.0,
        "delivery_fee": 5.00,
        "total_cost": 60.20
    },
    {
        "first_name": "David",
        "last_name": "Garcia",
        "email": "david@example.com",
        "phone": "408-555-0104",
        "password": "password123",
        "delivery_address": "321 West St",
        "delivery_city": "San Jose",
        "delivery_state": "CA",
        "delivery_zip": "95126",
        "delivery_lat": 37.3320,
        "delivery_lng": -121.9050,
        "subtotal": 35.20,
        "total_weight": 15.0,
        "delivery_fee": 5.00,
        "total_cost": 40.20
    }
]


def seed():
    with app.app_context():
        for c in CUSTOMERS:
            existing_user = User.query.filter_by(email=c["email"]).first()

            if existing_user:
                print(f"Skipping existing user: {c['email']}")
                continue

            user = User(
                first_name=c["first_name"],
                last_name=c["last_name"],
                email=c["email"],
                phone_number=c["phone"],
                role=UserRole.CUSTOMER
            )
            user.set_password(c["password"])
            db.session.add(user)
            db.session.flush()

            profile = CustomerProfile(
                user_id=user.id,
                delivery_address=c["delivery_address"]
            )
            db.session.add(profile)
            db.session.flush()

            order = Order(
                customer_id=profile.id,
                delivery_address=c["delivery_address"],
                delivery_city=c["delivery_city"],
                delivery_state=c["delivery_state"],
                delivery_zip=c["delivery_zip"],
                delivery_lat=c["delivery_lat"],
                delivery_lng=c["delivery_lng"],
                subtotal=c["subtotal"],
                total_weight=c["total_weight"],
                delivery_fee=c["delivery_fee"],
                total_cost=c["total_cost"],
                status="pending"
            )
            db.session.add(order)

        db.session.commit()
        print("Seeded customers and orders successfully.")


if __name__ == "__main__":
    seed()