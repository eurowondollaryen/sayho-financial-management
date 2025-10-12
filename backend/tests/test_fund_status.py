import pytest


@pytest.mark.asyncio
async def test_fund_category_and_snapshot_flow(client):
    signup_payload = {
        "email": "status@example.com",
        "name": "Status Owner",
        "password": "StrongPass123!",
    }
    signup_resp = await client.post("/auth/signup", json=signup_payload)
    assert signup_resp.status_code == 201

    login_resp = await client.post(
        "/auth/login",
        data={"username": signup_payload["email"], "password": signup_payload["password"]},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    category_payload = {
        "asset_type": "real_estate",
        "name": "Apartment",
        "is_active": True,
        "note": "Seoul Gangnam",
    }
    create_category_resp = await client.post("/fund-categories/", json=category_payload, headers=headers)
    assert create_category_resp.status_code == 201
    category_id = create_category_resp.json()["id"]
    assert create_category_resp.json()["asset_type"] == "real_estate"

    list_category_resp = await client.get("/fund-categories/", headers=headers)
    assert list_category_resp.status_code == 200
    categories = list_category_resp.json()
    assert any(cat["id"] == category_id for cat in categories)

    update_category_resp = await client.patch(
        f"/fund-categories/{category_id}", json={"is_active": False}, headers=headers
    )
    assert update_category_resp.status_code == 200
    assert update_category_resp.json()["is_active"] is False

    snapshot_payload = {
        "reference_date": "2025-02-01",
        "amount": "12345.67",
        "category_id": category_id,
    }
    create_snapshot_resp = await client.post("/fund-snapshots/", json=snapshot_payload, headers=headers)
    assert create_snapshot_resp.status_code == 201
    snapshot_id = create_snapshot_resp.json()["id"]
    assert create_snapshot_resp.json()["category"]["id"] == category_id

    list_snapshot_resp = await client.get("/fund-snapshots/", headers=headers)
    assert list_snapshot_resp.status_code == 200
    snapshots = list_snapshot_resp.json()
    assert any(snap["id"] == snapshot_id for snap in snapshots)

    update_snapshot_resp = await client.patch(
        f"/fund-snapshots/{snapshot_id}", json={"amount": "15000.00"}, headers=headers
    )
    assert update_snapshot_resp.status_code == 200
    assert update_snapshot_resp.json()["amount"] == "15000.00"

    delete_snapshot_resp = await client.delete(f"/fund-snapshots/{snapshot_id}", headers=headers)
    assert delete_snapshot_resp.status_code == 204

    delete_category_resp = await client.delete(f"/fund-categories/{category_id}", headers=headers)
    assert delete_category_resp.status_code == 204
