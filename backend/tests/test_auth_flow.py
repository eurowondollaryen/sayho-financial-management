import pytest


@pytest.mark.asyncio
async def test_signup_login_and_me(client):
    signup_payload = {
        "email": "user@example.com",
        "name": "Test User",
        "password": "VerySecure123!",
    }
    response = await client.post("/auth/signup", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == signup_payload["email"]
    assert data["name"] == signup_payload["name"]

    login_response = await client.post(
        "/auth/login",
        data={"username": signup_payload["email"], "password": signup_payload["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]

    me_response = await client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == signup_payload["email"]


@pytest.mark.asyncio
async def test_signup_and_login_with_long_password(client):
    long_password = "super-secure-password-that-exceeds-bcrypt-limit" * 3
    signup_payload = {
        "email": "longpass@example.com",
        "name": "Long Password User",
        "password": long_password,
    }
    signup_response = await client.post("/auth/signup", json=signup_payload)
    assert signup_response.status_code == 201

    login_response = await client.post(
        "/auth/login",
        data={"username": signup_payload["email"], "password": long_password},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()
