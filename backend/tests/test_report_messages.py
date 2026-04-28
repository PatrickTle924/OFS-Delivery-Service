from models import Product


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


def create_test_report(client, token, order_id):
    response = client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "missing_item",
            "description": "Missing product"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.get_json()["report_id"]


def test_customer_send_report_message_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)
    report_id = create_test_report(client, token, order_id)

    response = client.post(
        f"/reports/{report_id}/messages",
        json={"message": "Please help with this order."},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Please help with this order."
    assert data["sender_role"] == "customer"


def test_employee_send_report_message_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)
    report_id = create_test_report(client, customer_token, order_id)

    response = client.post(
        f"/reports/{report_id}/messages",
        json={"message": "We are reviewing your case."},
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["sender_role"] == "employee"


def test_get_report_messages_customer_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)
    report_id = create_test_report(client, token, order_id)

    client.post(
        f"/reports/{report_id}/messages",
        json={"message": "Need assistance"},
        headers={"Authorization": f"Bearer {token}"}
    )

    response = client.get(
        f"/reports/{report_id}/messages",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_send_report_message_empty_rejected(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)
    report_id = create_test_report(client, token, order_id)

    response = client.post(
        f"/reports/{report_id}/messages",
        json={"message": ""},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Message cannot be empty"