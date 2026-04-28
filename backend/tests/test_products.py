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


def test_get_products_requires_auth(client):
    response = client.get("/products")
    assert response.status_code in (401, 422)


def test_get_products_success(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.get(
        "/products",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "name" in data[0]
    assert "price" in data[0]


def test_inventory_employee_only(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.get(
        "/inventory",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403
    assert response.get_json()["error"] == "Access denied"


def test_inventory_employee_success(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.get(
        "/inventory",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)