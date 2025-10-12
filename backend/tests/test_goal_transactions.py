import pytest


@pytest.mark.asyncio
async def test_goal_creation_and_transaction_flow(client):
    signup_payload = {
        "email": "member@example.com",
        "name": "Goal Owner",
        "password": "ComplexPass123!",
    }
    signup_resp = await client.post("/auth/signup", json=signup_payload)
    assert signup_resp.status_code == 201

    login_resp = await client.post(
        "/auth/login",
        data={"username": signup_payload["email"], "password": signup_payload["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    goal_payload = {
        "title": "House Fund",
        "description": "Save for down payment",
        "target_amount": "100000.00",
        "target_date": "2030-12-31",
        "contribution_ratio": 0.6,
    }
    goal_resp = await client.post("/goals/", json=goal_payload, headers=headers)
    assert goal_resp.status_code == 201
    goal_id = goal_resp.json()["id"]

    tx_payload = {
        "type": "deposit",
        "amount": "1000.00",
        "category": "salary",
        "occurred_on": "2025-01-15",
        "memo": "Monthly contribution",
    }
    create_tx_resp = await client.post(
        f"/goals/{goal_id}/transactions/", json=tx_payload, headers=headers
    )
    assert create_tx_resp.status_code == 201
    transaction_id = create_tx_resp.json()["id"]

    list_tx_resp = await client.get(f"/goals/{goal_id}/transactions/", headers=headers)
    assert list_tx_resp.status_code == 200
    transactions = list_tx_resp.json()
    assert len(transactions) == 1
    assert transactions[0]["id"] == transaction_id

    delete_resp = await client.delete(
        f"/goals/{goal_id}/transactions/{transaction_id}", headers=headers
    )
    assert delete_resp.status_code == 204
