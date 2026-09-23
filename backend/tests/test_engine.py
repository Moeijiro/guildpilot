import pytest
import json
from sqlalchemy import select
from app.db.models import GuildSettings, OnboardingFlow, OnboardingStep, MemberOnboarding
from app.services.engine import (
    interpolate_template, get_or_create_member_onboarding,
    process_step_completion, reset_member_journey
)
from tests.conftest import TestingSessionLocal

def test_template_interpolation():
    template = "Hello {{username}}! Welcome to {{server_name}}. You are member #{{member_count}}."
    res = interpolate_template(template, username="Moeijiro", server_name="TechHub", member_count=142)
    assert res == "Hello Moeijiro! Welcome to TechHub. You are member #142."

@pytest.mark.asyncio
async def test_full_onboarding_progression_and_role_mapping():
    guild_id = "g_1001"
    user_id = "u_999"

    async with TestingSessionLocal() as db:
        # Setup guild & flow
        guild = GuildSettings(guild_id=guild_id, guild_name="Test Guild", completion_role_id="role-verified")
        flow = OnboardingFlow(guild_id=guild_id, title="Test Flow")
        db.add(guild)
        db.add(flow)
        await db.commit()
        await db.refresh(flow)

        step1 = OnboardingStep(
            flow_id=flow.id, step_order=1, step_type="button_choice",
            title="Region", description="Pick your region",
            options_json=json.dumps([
                {"key": "eu", "label": "Europe", "role_id": "role-eu", "role_name": "Europe"},
                {"key": "na", "label": "North America", "role_id": "role-na", "role_name": "North America"}
            ])
        )
        step2 = OnboardingStep(
            flow_id=flow.id, step_order=2, step_type="rules_confirm",
            title="Rules", description="Accept rules"
        )
        db.add(step1)
        db.add(step2)
        await db.commit()
        await db.refresh(step1)
        await db.refresh(step2)

        # 1. Start onboarding
        member = await get_or_create_member_onboarding(guild_id, user_id, "Bob", None, db)
        assert member.current_step_index == 0
        assert member.status == "in_progress"

        # 2. Complete Step 1 (Choose EU)
        member, finished, assigned = await process_step_completion(guild_id, user_id, step1.id, "eu", db)
        assert member.current_step_index == 1
        assert finished is False
        assert "role-eu" in assigned
        assert "role-eu" in json.loads(member.assigned_role_ids_json)

        # 3. Complete Step 2 (Accept rules -> triggers completion and completion role)
        member, finished, assigned2 = await process_step_completion(guild_id, user_id, step2.id, "accepted", db)
        assert member.current_step_index == 2
        assert finished is True
        assert member.status == "completed"
        assert member.completed_at is not None
        assert "role-verified" in json.loads(member.assigned_role_ids_json)

        # 4. Admin reset
        reset_m = await reset_member_journey(guild_id, user_id, db)
        assert reset_m.current_step_index == 0
        assert reset_m.status == "in_progress"
        assert reset_m.completed_at is None
        assert json.loads(reset_m.assigned_role_ids_json) == []
