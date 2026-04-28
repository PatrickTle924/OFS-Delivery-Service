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


def test_me_success_customer(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.get(
        "/me",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "customer@test.com"
    assert data["role"] == "customer"


def test_profile_success_customer(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.get(
        "/profile",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["email"] == "customer@test.com"
    assert data["address"] == "123 Main St"
    assert data["role"] == "customer"


def test_change_password_success(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/change-password",
        json={
            "currentPassword": "strongpassword1",
            "newPassword": "newstrongpassword1"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["message"] == "Password changed successfully"

    login_response = client.post("/login", json={
        "email": "customer@test.com",
        "password": "newstrongpassword1"
    })
    assert login_response.status_code == 200


def test_change_password_wrong_current_password(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/change-password",
        json={
            "currentPassword": "wrongpassword",
            "newPassword": "newstrongpassword1"
        },
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert response.get_json()["error"] == "Current password is incorrect"


def test_change_password_missing_fields(client, customer_user):
    token = get_customer_token(client, customer_user)

    response = client.post(
        "/change-password",
        json={},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 400
    assert "required" in response.get_json()["error"]