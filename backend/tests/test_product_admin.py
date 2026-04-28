from database import db
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


def test_create_product_employee_success(client, employee_user, app_context):
    token = get_employee_token(client, employee_user)

    response = client.post(
        "/products",
        data={
            "name": "Test Bread",
            "description": "Fresh bread",
            "weight": "1.5",
            "price": "3.99",
            "category": "bakery",
            "quantity": "20"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Product created successfully"

    created = Product.query.get(data["id"])
    assert created is not None
    assert created.name == "Test Bread"


def test_create_product_customer_forbidden(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/products",
        data={
            "name": "Bad Product",
            "weight": "1.0",
            "price": "1.99",
            "category": "test",
            "quantity": "5"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403


def test_update_product_employee_success(client, employee_user, app_context):
    token = get_employee_token(client, employee_user)
    product = Product.query.first()

    response = client.put(
        f"/products/{product.product_id}",
        data={
            "name": "Updated Apples",
            "description": "Updated description",
            "weight": "3.0",
            "price": "6.99",
            "category": "fruits",
            "quantity": "15"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Product updated successfully"

    updated = Product.query.get(product.product_id)
    assert updated.name == "Updated Apples"
    assert updated.stock == 15


def test_update_product_not_found(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.put(
        "/products/99999",
        data={"name": "Nope"},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404
    assert response.get_json()["error"] == "Product not found"


def test_delete_product_employee_success(client, employee_user, app_context):
    token = get_employee_token(client, employee_user)
    product = Product.query.first()
    pid = product.product_id

    response = client.delete(
        f"/products/{pid}",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Product deleted successfully"
    assert Product.query.get(pid) is None


def test_delete_product_not_found(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.delete(
        "/products/99999",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 404