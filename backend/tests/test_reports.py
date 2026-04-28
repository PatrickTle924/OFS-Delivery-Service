from database import db
from models import Product, Report


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
            },
            "tax": 1.00
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    return response.get_json()["order_id"]


def test_create_report_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)

    response = client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "missing_item",
            "description": "Item missing from order"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Report submitted successfully"

    report = Report.query.get(data["report_id"])
    assert report is not None


def test_create_report_missing_fields(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/reports",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Missing required fields"


def test_get_reports_employee_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)

    client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "damaged_item",
            "description": "Product arrived damaged"
        },
        headers={"Authorization": f"Bearer {customer_token}"}
    )

    response = client.get(
        "/reports",
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_get_my_reports_customer_success(client, customer_user, app_context):
    token = get_customer_token(client, customer_user)
    product = Product.query.first()
    order_id = create_test_order(client, token, product.product_id)

    client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "wrong_item",
            "description": "Wrong product sent"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    response = client.get(
        "/reports/mine",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_update_report_status_success(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)

    create_response = client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "damaged_item",
            "description": "Broken container"
        },
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    report_id = create_response.get_json()["report_id"]

    response = client.put(
        f"/reports/{report_id}",
        json={"status": "resolved"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Report updated successfully"


def test_update_report_invalid_status(client, customer_user, employee_user, app_context):
    customer_token = get_customer_token(client, customer_user)
    employee_token = get_employee_token(client, employee_user)
    product = Product.query.first()
    order_id = create_test_order(client, customer_token, product.product_id)

    create_response = client.post(
        "/reports",
        json={
            "order_id": order_id,
            "report_type": "damaged_item",
            "description": "Broken container"
        },
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    report_id = create_response.get_json()["report_id"]

    response = client.put(
        f"/reports/{report_id}",
        json={"status": "bad_status"},
        headers={"Authorization": f"Bearer {employee_token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Invalid status"