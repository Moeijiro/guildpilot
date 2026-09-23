"""The bot's answer handler, with Discord replaced by fakes (no token or network needed)."""

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from app.bot import client as bot_client
from app.models import GuildSettings, OnboardingFlow, OnboardingStep
from app.services.engine import get_or_create_member_onboarding
from tests.conftest import TestingSessionLocal


async def _flow(db, guild_id):
    db.add(GuildSettings(guild_id=guild_id, guild_name="Test"))
    flow = OnboardingFlow(guild_id=guild_id, title="Flow", is_active=True)
    db.add(flow)
    await db.flush()
    steps = [
        OnboardingStep(flow_id=flow.id, step_order=1, step_type="rules_confirm", title="Rules", description="Accept",
                       options_json=json.dumps([{"key": "rules", "label": "I accept"}])),
        OnboardingStep(flow_id=flow.id, step_order=2, step_type="button_choice", title="Region", description="Pick",
                       options_json=json.dumps([{"key": "eu", "label": "Europe", "role_id": "role-europe"}])),
    ]
    db.add_all(steps)
    await db.commit()
    return steps


def _interaction(user_id="42"):
    return SimpleNamespace(user=SimpleNamespace(id=int(user_id), name="newbie"), followup=SimpleNamespace(send=AsyncMock()))


@pytest.mark.asyncio
async def test_an_answer_advances_the_member_and_sends_the_next_step():
    async with TestingSessionLocal() as db:
        steps = await _flow(db, "123")
        await get_or_create_member_onboarding("123", "42", "newbie", None, db)

    interaction = _interaction()
    with patch.object(bot_client, "AsyncSessionLocal", TestingSessionLocal), patch.object(bot_client, "_send_step", AsyncMock()) as send_step:
        await bot_client._handle_answer(interaction, "123", steps[0].id, "rules")
    send_step.assert_awaited_once()
    assert send_step.await_args.args[3] == 1  # step index 1: the region choice


@pytest.mark.asyncio
async def test_a_wrong_answer_is_explained_to_the_member():
    async with TestingSessionLocal() as db:
        steps = await _flow(db, "124")
        await get_or_create_member_onboarding("124", "42", "newbie", None, db)

    interaction = _interaction()
    with patch.object(bot_client, "AsyncSessionLocal", TestingSessionLocal):
        await bot_client._handle_answer(interaction, "124", steps[1].id, "eu")  # skipping step 1
    message = interaction.followup.send.await_args.args[0]
    assert "step 1" in message


def test_roles_resolve_by_id_or_name():
    roles = [SimpleNamespace(id=7, name="Europe"), SimpleNamespace(id=8, name="Member Verified")]
    guild = SimpleNamespace(roles=roles, get_role=lambda i: next((r for r in roles if r.id == i), None))
    assert bot_client._resolve_role(guild, "7").name == "Europe"
    assert bot_client._resolve_role(guild, "role-member-verified").name == "Member Verified"
