import json
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List, Optional, Any

from app.db.session import get_db
from app.db.models import MemberOnboarding, OnboardingFlow, OnboardingStep
from app.schemas.member import MemberProgressOut
from app.services.engine import StepRejected, process_step_completion, reset_member_journey

router = APIRouter()

@router.get("/{guild_id}/members", response_model=List[MemberProgressOut])
async def list_guild_members(
    guild_id: str,
    status: Optional[str] = Query(None, description="Filter by status: not_started, in_progress, completed, expired"),
    db: AsyncSession = Depends(get_db)
):
    # Total steps for percentage calculation
    stmt_flow = select(OnboardingFlow).where(
        and_(OnboardingFlow.guild_id == guild_id, OnboardingFlow.is_active == True)
    )
    res_flow = await db.execute(stmt_flow)
    flow = res_flow.scalar_one_or_none()
    total_steps = 1
    if flow:
        stmt_steps = select(OnboardingStep).where(OnboardingStep.flow_id == flow.id)
        res_steps = await db.execute(stmt_steps)
        total_steps = max(1, len(res_steps.scalars().all()))

    stmt_m = select(MemberOnboarding).where(MemberOnboarding.guild_id == guild_id).order_by(MemberOnboarding.joined_at.desc())
    res_m = await db.execute(stmt_m)
    members = res_m.scalars().all()

    if status:
        members = [m for m in members if m.status == status]

    out = []
    for m in members:
        pct = 100 if m.status == "completed" else min(95, int((m.current_step_index / total_steps) * 100))
        out.append(MemberProgressOut(
            id=m.id,
            guild_id=m.guild_id,
            user_id=m.user_id,
            username=m.username,
            avatar_url=m.avatar_url,
            current_step_index=m.current_step_index,
            total_steps=total_steps,
            status=m.status,
            selected_data=json.loads(m.selected_data_json or "{}"),
            assigned_roles=json.loads(m.assigned_role_ids_json or "[]"),
            joined_at=m.joined_at,
            completed_at=m.completed_at,
            progress_percentage=pct
        ))
    return out

@router.post("/{guild_id}/members/{user_id}/reset")
async def reset_member(guild_id: str, user_id: str, db: AsyncSession = Depends(get_db)):
    try:
        member = await reset_member_journey(guild_id, user_id, db)
        return {"message": f"Successfully reset onboarding for member {user_id}", "status": member.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{guild_id}/members/{user_id}/advance")
async def advance_member(
    guild_id: str,
    user_id: str,
    step_id: int = Body(..., embed=True),
    user_selection: Any = Body("accepted", embed=True),
    db: AsyncSession = Depends(get_db)
):
    try:
        member, is_finished, assigned = await process_step_completion(
            guild_id, user_id, step_id, user_selection, db
        )
        return {
            "current_step_index": member.current_step_index,
            "status": member.status,
            "is_finished": is_finished,
            "assigned_roles": assigned
        }
    except StepRejected as e:
        raise HTTPException(status_code=409, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
