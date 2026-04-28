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


def test_employee_can_access_orders(client, employee_user):
    token = get_employee_token(client, employee_user)

    response = client.get(
        "/orders",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200


def test_customer_cannot_access_orders(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.get(
        "/orders",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 403
    assert response.get_json()["error"] == "Access denied"


def test_me_requires_auth(client):
    response = client.get("/me")
    assert response.status_code in (401, 422)