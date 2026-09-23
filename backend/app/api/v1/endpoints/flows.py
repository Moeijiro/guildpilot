import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List

from app.db.session import get_db
from app.db.models import OnboardingFlow, OnboardingStep, GuildSettings
from app.schemas.flow import (
    FlowOut, FlowCreate, StepCreate, StepUpdate, StepOut, FlowReorder, StepOption
)

router = APIRouter()

def serialize_step(step: OnboardingStep) -> StepOut:
    options = []
    if step.options_json:
        try:
            raw = json.loads(step.options_json)
            options = [StepOption(**o) for o in raw]
        except Exception:
            pass
    return StepOut(
        id=step.id,
        flow_id=step.flow_id,
        step_order=step.step_order,
        step_type=step.step_type,
        title=step.title,
        description=step.description,
        options=options,
        created_at=step.created_at
    )

@router.get("/{guild_id}/flow", response_model=FlowOut)
async def get_guild_flow(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(OnboardingFlow).where(
        and_(OnboardingFlow.guild_id == guild_id, OnboardingFlow.is_active == True)
    )
    res = await db.execute(stmt)
    flow = res.scalar_one_or_none()

    if not flow:
        # Auto-create default flow if non-existent
        flow = OnboardingFlow(
            guild_id=guild_id,
            title="Community Gateway",
            description="Default welcome and onboarding journey.",
            is_active=True
        )
        db.add(flow)
        await db.commit()
        await db.refresh(flow)

    stmt_steps = select(OnboardingStep).where(OnboardingStep.flow_id == flow.id).order_by(OnboardingStep.step_order)
    res_steps = await db.execute(stmt_steps)
    steps = res_steps.scalars().all()

    return FlowOut(
        id=flow.id,
        guild_id=flow.guild_id,
        title=flow.title,
        description=flow.description,
        is_active=flow.is_active,
        steps=[serialize_step(s) for s in steps],
        created_at=flow.created_at
    )

@router.post("/{guild_id}/flow/steps", response_model=StepOut, status_code=status.HTTP_201_CREATED)
async def add_flow_step(guild_id: str, payload: StepCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(OnboardingFlow).where(
        and_(OnboardingFlow.guild_id == guild_id, OnboardingFlow.is_active == True)
    )
    res = await db.execute(stmt)
    flow = res.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Active onboarding flow not found.")

    # Calculate step order
    stmt_count = select(OnboardingStep).where(OnboardingStep.flow_id == flow.id)
    res_count = await db.execute(stmt_count)
    current_count = len(res_count.scalars().all())

    order = payload.step_order if payload.step_order is not None else current_count + 1

    options_json = None
    if payload.options:
        options_json = json.dumps([o.model_dump() for o in payload.options])

    step = OnboardingStep(
        flow_id=flow.id,
        step_order=order,
        step_type=payload.step_type,
        title=payload.title,
        description=payload.description,
        options_json=options_json
    )
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return serialize_step(step)

@router.put("/{guild_id}/flow/steps/{step_id}", response_model=StepOut)
async def update_flow_step(guild_id: str, step_id: int, payload: StepUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(OnboardingStep).where(OnboardingStep.id == step_id)
    res = await db.execute(stmt)
    step = res.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found.")

    if payload.title is not None:
        step.title = payload.title
    if payload.description is not None:
        step.description = payload.description
    if payload.options is not None:
        step.options_json = json.dumps([o.model_dump() for o in payload.options])

    await db.commit()
    await db.refresh(step)
    return serialize_step(step)

@router.delete("/{guild_id}/flow/steps/{step_id}", status_code=status.HTTP_200_OK)
async def delete_flow_step(guild_id: str, step_id: int, db: AsyncSession = Depends(get_db)):
    stmt = select(OnboardingStep).where(OnboardingStep.id == step_id)
    res = await db.execute(stmt)
    step = res.scalar_one_or_none()
    if not step:
        raise HTTPException(status_code=404, detail="Step not found.")

    await db.delete(step)
    await db.commit()
    return {"message": "Step deleted successfully."}

@router.post("/{guild_id}/flow/reorder")
async def reorder_flow_steps(guild_id: str, payload: FlowReorder, db: AsyncSession = Depends(get_db)):
    for new_order, s_id in enumerate(payload.step_ids_order, start=1):
        stmt = select(OnboardingStep).where(OnboardingStep.id == s_id)
        res = await db.execute(stmt)
        step = res.scalar_one_or_none()
        if step:
            step.step_order = new_order
    await db.commit()
    return {"message": "Steps reordered successfully."}
