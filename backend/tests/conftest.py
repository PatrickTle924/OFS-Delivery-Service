import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["JWT_SECRET_KEY"] = "this-is-a-test-secret-key-with-32-plus-bytes"

from app import app
from database import db
from models import User, UserRole, CustomerProfile, EmployeeProfile, Product


@pytest.fixture
def client():
    app.config["TESTING"] = True

    with app.app_context():
        db.create_all()

        # seed product for tests
        product = Product(
            name="Test Apples",
            category="fruits",
            cost=4.99,
            weight=2.0,
            stock=10,
            description="test product",
            image_url=""
        )
        db.session.add(product)
        db.session.commit()

        yield app.test_client()

        db.session.remove()
        db.drop_all()


@pytest.fixture
def app_context():
    with app.app_context():
        yield


@pytest.fixture
def customer_user(app_context):
    user = User(
        first_name="Jane",
        last_name="Customer",
        email="customer@test.com",
        phone_number="(123) 456-7890",
        role=UserRole.CUSTOMER
    )
    user.set_password("strongpassword1")
    db.session.add(user)
    db.session.flush()

    profile = CustomerProfile(
        user_id=user.id,
        delivery_address="123 Main St"
    )
    db.session.add(profile)
    db.session.commit()
    return user


@pytest.fixture
def employee_user(app_context):
    user = User(
        first_name="Eli",
        last_name="Employee",
        email="employee@test.com",
        phone_number="(123) 456-7890",
        role=UserRole.EMPLOYEE
    )
    user.set_password("strongpassword1")
    db.session.add(user)
    db.session.flush()

    profile = EmployeeProfile(
        user_id=user.id,
        employee_id="EMP-12345"
    )
    db.session.add(profile)
    db.session.commit()
    return user