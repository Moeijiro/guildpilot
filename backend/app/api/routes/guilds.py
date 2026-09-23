import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.session import get_db
from app.models import GuildSettings, MemberOnboarding, OnboardingLog
from app.schemas.guild import GuildSettingsOut, OverviewMetricsOut
from app.schemas.member import OnboardingLogOut

router = APIRouter()

@router.get("/{guild_id}/overview", response_model=OverviewMetricsOut)
async def get_guild_overview(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt_m = select(MemberOnboarding).where(MemberOnboarding.guild_id == guild_id)
    res_m = await db.execute(stmt_m)
    members = res_m.scalars().all()

    total = len(members)
    completed = [m for m in members if m.status == "completed"]
    incomplete = total - len(completed)
    completion_rate = round((len(completed) / total * 100), 1) if total > 0 else 0.0

    # Average completion time in minutes
    durations = []
    for m in completed:
        if m.completed_at and m.joined_at:
            delta = (m.completed_at - m.joined_at).total_seconds() / 60.0
            durations.append(delta)
    avg_minutes = round(sum(durations) / len(durations), 1) if durations else 0.0

    recent_members = [
        {
            "user_id": m.user_id,
            "username": m.username or m.user_id,
            "status": m.status,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
            "completed_at": m.completed_at.isoformat() if m.completed_at else None
        }
        for m in sorted(members, key=lambda x: x.joined_at, reverse=True)[:5]
    ]

    return OverviewMetricsOut(
        new_members_count=total,
        completion_rate_percentage=completion_rate,
        incomplete_count=incomplete,
        average_completion_minutes=avg_minutes,
        recent_members=recent_members
    )

@router.get("/{guild_id}/settings", response_model=GuildSettingsOut)
async def get_settings(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(GuildSettings).where(GuildSettings.guild_id == guild_id)
    res = await db.execute(stmt)
    guild = res.scalar_one_or_none()
    if not guild:
        # Create default settings
        guild = GuildSettings(
            guild_id=guild_id,
            guild_name="Community Server",
            is_enabled=True,
            reminder_delay_minutes=30,
            max_reminders=2
        )
        db.add(guild)
        await db.commit()
        await db.refresh(guild)
    return guild

@router.get("/{guild_id}/logs", response_model=List[OnboardingLogOut])
async def get_logs(guild_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(OnboardingLog).where(OnboardingLog.guild_id == guild_id).order_by(OnboardingLog.timestamp.desc()).limit(50)
    res = await db.execute(stmt)
    return res.scalars().all()
