import pytest

@pytest.mark.asyncio
async def test_guild_flow_and_step_lifecycle(client):
    guild_id = "test-guild-42"

    res = await client.get(f"/api/v1/guilds/{guild_id}/flow")
    assert res.status_code == 200
    flow = res.json()
    assert flow["guild_id"] == guild_id
    assert len(flow["steps"]) == 0

    step_payload = {
        "step_type": "button_choice",
        "title": "Select Specialization",
        "description": "Choose your primary role",
        "options": [
            {"key": "fe", "label": "Frontend", "role_id": "role-fe"},
            {"key": "be", "label": "Backend", "role_id": "role-be"}
        ]
    }
    step_res = await client.post(f"/api/v1/guilds/{guild_id}/flow/steps", json=step_payload)
    assert step_res.status_code == 201
    step_data = step_res.json()
    assert step_data["title"] == "Select Specialization"
    assert len(step_data["options"]) == 2

    flow_res2 = await client.get(f"/api/v1/guilds/{guild_id}/flow")
    assert len(flow_res2.json()["steps"]) == 1

@pytest.mark.asyncio
async def test_demo_seed_endpoint(client):
    res = await client.post("/api/v1/demo/seed")
    assert res.status_code == 200
    assert "seeded successfully" in res.json()["message"]

    ov_res = await client.get("/api/v1/guilds/demo-guild-777/overview")
    assert ov_res.status_code == 200
    ov = ov_res.json()
    assert ov["new_members_count"] >= 5
    assert ov["completion_rate_percentage"] > 0
