import json
from datetime import datetime

from database import db
from models import Trip, Order, Product


def get_customer_token(client, customer_user):
    response = client.post("/login", json={
        "email": "customer@test.com",
        "password": "strongpassword1"
    })
    return response.get_json()["token"]


def get_employee_token(client, employee_user):
    response = client.post("/login", json={
        "email": "employee@test.com",
        "password": "strongpassword1"
    })
    return response.get_json()["token"]


def create_test_order(client, token, product_id):
    response = client.post(
        "/orders",
        json={
            "items": [{"product": {"id": product_id}, "quantity": 1}],
            "deliveryInfo": {
                "addressLine1": "123 Main St",
                "city": "San Jose",
                "zipCode": "95112"
            }
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.get_json()["order_id"]


def test_active_delivery_none_when_no_trip(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.get(
        "/active-delivery",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["activeDelivery"] is None


def test_approve_route_missing_route_data(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.post(
        "/approve-route",
        json={"orderIds": [1]},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing routeData"


def test_approve_route_missing_order_ids(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.post(
        "/approve-route",
        json={"routeData": {"totalWeight": 5}},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing orderIds"


def test_approve_route_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)

    order = Order.query.get(order_id)
    order.delivery_lat = 37.33
    order.delivery_lng = -121.89
    db.session.commit()

    response = client.post(
        "/approve-route",
        json={
            "orderIds": [order_id],
            "routeData": {
                "totalWeight": 5,
                "estimatedTime": 10,
                "totalDistance": 2.5,
                "routeGeometry": {
                    "type": "LineString",
                    "coordinates": [[-121.89, 37.33], [-121.88, 37.34]]
                }
            }
        },
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert "activeDelivery" in data


def test_start_trip_not_found(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.post(
        "/start-trip/99999",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Trip not found"


def test_start_trip_success(client, employee_user, app_context):
    token = get_employee_token(client, employee_user)

    trip = Trip(
        status="assigned",
        route_geometry=json.dumps({
            "type": "LineString",
            "coordinates": [[-121.89, 37.33], [-121.88, 37.34]]
        }),
        total_weight=10,
        total_orders=1,
        estimated_time=20,
        total_distance=3.2
    )
    db.session.add(trip)
    db.session.commit()

    response = client.post(
        f"/start-trip/{trip.trip_id}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Trip started"


def test_cancel_route_not_found(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.post(
        "/cancel-route/99999",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Trip not found"