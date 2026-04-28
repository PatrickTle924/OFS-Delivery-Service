def test_register_customer_success(client):
    payload = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "(123) 456-7890",
        "password": "verysecure123",
        "role": "customer",
        "deliveryAddress": "123 Main St"
    }

    response = client.post("/register", json=payload)

    assert response.status_code == 201
    assert response.get_json()["message"] == "Registration successful."


def test_register_duplicate_email(client, customer_user):
    payload = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "customer@test.com",
        "phone": "(123) 456-7890",
        "password": "verysecure123",
        "role": "customer",
        "deliveryAddress": "123 Main St"
    }

    response = client.post("/register", json=payload)

    assert response.status_code == 409
    assert "already exists" in response.get_json()["error"]


def test_register_invalid_phone(client):
    payload = {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john2@example.com",
        "phone": "1234567890",
        "password": "verysecure123",
        "role": "customer",
        "deliveryAddress": "123 Main St"
    }

    response = client.post("/register", json=payload)

    assert response.status_code == 400
    assert "Phone number must be in the format" in response.get_json()["error"]


def test_login_success(client, customer_user):
    response = client.post("/login", json={
        "email": "customer@test.com",
        "password": "strongpassword1"
    })

    assert response.status_code == 200
    data = response.get_json()
    assert "token" in data
    assert data["user"]["role"] == "customer"


def test_login_invalid_password(client, customer_user):
    response = client.post("/login", json={
        "email": "customer@test.com",
        "password": "wrongpassword"
    })

    assert response.status_code == 401
    assert response.get_json()["error"] == "Invalid credentials"


def test_login_missing_fields(client):
    response = client.post("/login", json={})
    assert response.status_code == 400
    assert response.get_json()["error"] == "Email and password are required"