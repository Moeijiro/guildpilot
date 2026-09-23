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


async def _step(client, guild_id, title, options=None):
    res = await client.post(f"/api/v1/guilds/{guild_id}/flow/steps", json={
        "step_type": "button_choice" if options else "rules_confirm", "title": title, "description": "Step description",
        "options": options,
    })
    assert res.status_code == 201
    return res.json()


@pytest.mark.asyncio
async def test_steps_cannot_be_edited_through_another_server(client):
    await client.get("/api/v1/guilds/owner-guild/flow")
    step = await _step(client, "owner-guild", "Rules")
    await client.get("/api/v1/guilds/other-guild/flow")

    assert (await client.put(f"/api/v1/guilds/other-guild/flow/steps/{step['id']}", json={"title": "Hijacked"})).status_code == 404
    assert (await client.delete(f"/api/v1/guilds/other-guild/flow/steps/{step['id']}")).status_code == 404
    assert (await client.post("/api/v1/guilds/other-guild/flow/reorder", json={"step_ids_order": [step["id"]]})).status_code == 400


@pytest.mark.asyncio
async def test_deleting_a_step_renumbers_the_rest(client):
    await client.get("/api/v1/guilds/order-guild/flow")
    ids = [(await _step(client, "order-guild", f"Step {i}"))["id"] for i in range(1, 4)]
    await client.delete(f"/api/v1/guilds/order-guild/flow/steps/{ids[0]}")
    steps = (await client.get("/api/v1/guilds/order-guild/flow")).json()["steps"]
    assert [s["step_order"] for s in steps] == [1, 2]


@pytest.mark.asyncio
async def test_members_answer_only_their_current_step_with_a_real_option(client):
    await client.post("/api/v1/demo/seed")
    steps = (await client.get("/api/v1/guilds/demo-guild-777/flow")).json()["steps"]
    # CyberKev is on step 3 (index 2): the region choice.
    skip = await client.post("/api/v1/guilds/demo-guild-777/members/user_103/advance", json={"step_id": steps[4]["id"], "user_selection": "unlock"})
    assert skip.status_code == 409
    bogus = await client.post("/api/v1/guilds/demo-guild-777/members/user_103/advance", json={"step_id": steps[2]["id"], "user_selection": "mars"})
    assert bogus.status_code == 409
    ok = await client.post("/api/v1/guilds/demo-guild-777/members/user_103/advance", json={"step_id": steps[2]["id"], "user_selection": "eu"})
    assert ok.status_code == 200 and ok.json()["current_step_index"] == 3
    done = await client.post("/api/v1/guilds/demo-guild-777/members/user_101/advance", json={"step_id": steps[0]["id"], "user_selection": "start"})
    assert done.status_code == 409


@pytest.mark.asyncio
async def test_demo_seed_fills_a_flow_that_was_auto_created_empty(client):
    assert (await client.get("/api/v1/guilds/demo-guild-777/flow")).json()["steps"] == []
    await client.post("/api/v1/demo/seed")
    await client.post("/api/v1/demo/seed")
    flow = (await client.get("/api/v1/guilds/demo-guild-777/flow")).json()
    assert len(flow["steps"]) == 5
