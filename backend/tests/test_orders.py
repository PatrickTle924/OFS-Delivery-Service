from database import db
from models import Product, Order


def get_customer_token(client, customer_user):
    response = client.post("/login", json={
        "email": "customer@test.com",
        "password": "strongpassword1"
    })
    return response.get_json()["token"]


def test_create_order_requires_auth(client):
    response = client.post("/orders", json={})
    assert response.status_code in (401, 422)


def test_create_order_no_items(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/orders",
        json={
            "items": [],
            "deliveryInfo": {}
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "No items in order"


def test_create_order_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)

    product = Product.query.first()
    starting_stock = product.stock

    payload = {
        "items": [
            {
                "product": {"id": product.product_id},
                "quantity": 2
            }
        ],
        "deliveryInfo": {
            "addressLine1": "123 Main St",
            "city": "San Jose",
            "zipCode": "95112"
        },
        "tax": 1.50
    }

    response = client.post(
        "/orders",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["message"] == "Order created"

    order = Order.query.get(body["order_id"])
    assert order is not None
    assert order.subtotal == 9.98
    assert order.total_weight == 4.0

    updated_product = Product.query.get(product.product_id)
    assert updated_product.stock == starting_stock - 2


def test_create_order_insufficient_stock(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)

    product = Product.query.first()

    payload = {
        "items": [
            {
                "product": {"id": product.product_id},
                "quantity": 999
            }
        ],
        "deliveryInfo": {
            "addressLine1": "123 Main St",
            "city": "San Jose",
            "zipCode": "95112"
        }
    }

    response = client.post(
        "/orders",
        json=payload,
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert "Not enough stock" in response.get_json()["error"]


def test_order_history_customer_only(client, employee_user):
    response = client.post("/login", json={
        "email": "employee@test.com",
        "password": "strongpassword1"
    })
    token = response.get_json()["token"]

    history_response = client.get(
        "/orders/history",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert history_response.status_code == 403