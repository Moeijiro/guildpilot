import json
import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models import (
    GuildSettings, OnboardingFlow, OnboardingStep, MemberOnboarding, OnboardingLog, RoleMapping
)

class StepRejected(ValueError):
    """The request is understood but not allowed in the member's current state (409)."""


def interpolate_template(template: str, username: str, server_name: str, member_count: int = 1) -> str:
    """Safely interpolates standard onboarding template variables."""
    replacements = {
        "{{username}}": username,
        "{{server_name}}": server_name,
        "{{member_count}}": str(member_count),
    }
    result = template
    for key, val in replacements.items():
        result = result.replace(key, val)
    return result

async def get_or_create_member_onboarding(
    guild_id: str,
    user_id: str,
    username: str,
    avatar_url: Optional[str],
    db: AsyncSession
) -> MemberOnboarding:
    stmt = select(MemberOnboarding).where(
        and_(MemberOnboarding.guild_id == guild_id, MemberOnboarding.user_id == user_id)
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        member = MemberOnboarding(
            guild_id=guild_id,
            user_id=user_id,
            username=username,
            avatar_url=avatar_url,
            current_step_index=0,
            status="in_progress",
            selected_data_json="{}",
            assigned_role_ids_json="[]",
            joined_at=datetime.datetime.utcnow()
        )
        db.add(member)
        db.add(OnboardingLog(
            guild_id=guild_id,
            user_id=user_id,
            event_type="onboarding_started",
            details=f"Member {username} initialized onboarding journey."
        ))
        await db.commit()
        await db.refresh(member)
    return member

async def process_step_completion(
    guild_id: str,
    user_id: str,
    step_id: int,
    user_selection: Any,
    db: AsyncSession
) -> Tuple[MemberOnboarding, bool, List[str]]:
    """
    Records member's step answer, resolves role mappings, and advances state.
    Returns: (MemberOnboarding, is_finished, newly_assigned_roles)
    """
    stmt_m = select(MemberOnboarding).where(
        and_(MemberOnboarding.guild_id == guild_id, MemberOnboarding.user_id == user_id)
    )
    res_m = await db.execute(stmt_m)
    member = res_m.scalar_one_or_none()
    if not member:
        raise ValueError("Member journey not found.")

    if member.status == "completed":
        raise StepRejected("This member has already finished onboarding.")

    # The member can only answer the step they are on, in this server's active flow.
    stmt_flow = select(OnboardingFlow).where(and_(OnboardingFlow.guild_id == guild_id, OnboardingFlow.is_active == True))  # noqa: E712
    flow = (await db.execute(stmt_flow)).scalar_one_or_none()
    if not flow:
        raise ValueError("Active onboarding flow not found.")
    stmt_steps = select(OnboardingStep).where(OnboardingStep.flow_id == flow.id).order_by(OnboardingStep.step_order)
    all_steps = (await db.execute(stmt_steps)).scalars().all()
    step = next((s for s in all_steps if s.id == step_id), None)
    if step is None:
        raise ValueError("Step not found.")
    if member.current_step_index >= len(all_steps) or all_steps[member.current_step_index].id != step.id:
        raise StepRejected(f"This member is on step {member.current_step_index + 1}, not step {step.step_order}.")

    options = json.loads(step.options_json) if step.options_json else []
    if options:
        valid = {o.get("key") for o in options}
        chosen = user_selection if isinstance(user_selection, list) else [user_selection]
        if not chosen or any(c not in valid for c in chosen):
            raise StepRejected("Pick one of the options this step offers.")

    # Update selected data
    selected_data = json.loads(member.selected_data_json or "{}")
    selected_data[f"step_{step.id}"] = user_selection
    member.selected_data_json = json.dumps(selected_data)

    # Determine mapped roles
    newly_assigned_roles: List[str] = []
    assigned_roles = json.loads(member.assigned_role_ids_json or "[]")

    if options:
        selection_list = user_selection if isinstance(user_selection, list) else [user_selection]
        
        for opt in options:
            if opt.get("key") in selection_list and opt.get("role_id"):
                role_id = opt["role_id"]
                if role_id not in assigned_roles:
                    assigned_roles.append(role_id)
                    newly_assigned_roles.append(role_id)
                    db.add(OnboardingLog(
                        guild_id=guild_id,
                        user_id=user_id,
                        event_type="role_assigned",
                        details=f"Assigned role '{opt.get('role_name', role_id)}' for selection '{opt.get('label')}'."
                    ))

    member.assigned_role_ids_json = json.dumps(assigned_roles)
    
    # Advance step
    member.current_step_index += 1
    db.add(OnboardingLog(
        guild_id=guild_id,
        user_id=user_id,
        event_type="step_completed",
        details=f"Completed Step {step.step_order}: '{step.title}'."
    ))

    is_finished = False
    if member.current_step_index >= len(all_steps):
        member.current_step_index = len(all_steps)
        member.status = "completed"
        member.completed_at = datetime.datetime.utcnow()
        is_finished = True
        
        # Check guild settings for completion role
        stmt_g = select(GuildSettings).where(GuildSettings.guild_id == guild_id)
        res_g = await db.execute(stmt_g)
        guild_settings = res_g.scalar_one_or_none()
        if guild_settings and guild_settings.completion_role_id:
            c_role = guild_settings.completion_role_id
            if c_role not in assigned_roles:
                assigned_roles.append(c_role)
                newly_assigned_roles.append(c_role)
                member.assigned_role_ids_json = json.dumps(assigned_roles)

        db.add(OnboardingLog(
            guild_id=guild_id,
            user_id=user_id,
            event_type="onboarding_finished",
            details=f"Onboarding journey completed successfully for {member.username or user_id}."
        ))

    await db.commit()
    await db.refresh(member)
    return member, is_finished, newly_assigned_roles

async def reset_member_journey(guild_id: str, user_id: str, db: AsyncSession) -> MemberOnboarding:
    stmt = select(MemberOnboarding).where(
        and_(MemberOnboarding.guild_id == guild_id, MemberOnboarding.user_id == user_id)
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()
    if not member:
        raise ValueError("Member journey not found.")

    member.current_step_index = 0
    member.status = "in_progress"
    member.selected_data_json = "{}"
    member.assigned_role_ids_json = "[]"
    member.completed_at = None
    member.reminders_sent = 0

    db.add(OnboardingLog(
        guild_id=guild_id,
        user_id=user_id,
        event_type="onboarding_reset",
        details=f"Administrator reset onboarding journey for member {member.username or user_id}."
    ))
    await db.commit()
    await db.refresh(member)
    return member
