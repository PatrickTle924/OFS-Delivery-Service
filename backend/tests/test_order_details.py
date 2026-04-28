from models import Product, Order


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
            "items": [{"product": {"id": product_id}, "quantity": 2}],
            "deliveryInfo": {
                "addressLine1": "123 Main St",
                "city": "San Jose",
                "zipCode": "95112"
            },
            "tax": 1.50
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.get_json()["order_id"]


def test_get_order_details_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)

    response = client.get(f"/orders/{order_id}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["order_id"] == order_id
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2


def test_get_order_details_not_found(client):
    response = client.get("/orders/99999")
    assert response.status_code == 404
    assert response.get_json()["error"] == "Order not found"


def test_get_order_items_employee_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)

    response = client.get(
        f"/orders/{order_id}/items",
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 1
    assert data[0]["quantity"] == 2


def test_get_order_items_forbidden_for_customer(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)

    response = client.get(
        f"/orders/{order_id}/items",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_orders_all_employee_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    create_test_order(client, customer_token, product.product_id)

    response = client.get(
        "/orders/all",
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1