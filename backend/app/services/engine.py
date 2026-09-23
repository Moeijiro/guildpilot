import json
import datetime
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.db.models import (
    GuildSettings, OnboardingFlow, OnboardingStep, MemberOnboarding, OnboardingLog, RoleMapping
)

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

    # Retrieve step
    stmt_s = select(OnboardingStep).where(OnboardingStep.id == step_id)
    res_s = await db.execute(stmt_s)
    step = res_s.scalar_one_or_none()
    if not step:
        raise ValueError("Step not found.")

    # Load flow steps to calculate total
    stmt_steps = select(OnboardingStep).where(OnboardingStep.flow_id == step.flow_id).order_by(OnboardingStep.step_order)
    res_steps = await db.execute(stmt_steps)
    all_steps = res_steps.scalars().all()

    # Update selected data
    selected_data = json.loads(member.selected_data_json or "{}")
    selected_data[f"step_{step.id}"] = user_selection
    member.selected_data_json = json.dumps(selected_data)

    # Determine mapped roles
    newly_assigned_roles: List[str] = []
    assigned_roles = json.loads(member.assigned_role_ids_json or "[]")

    if step.options_json:
        options = json.loads(step.options_json)
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
