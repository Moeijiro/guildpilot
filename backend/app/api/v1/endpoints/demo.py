import json
import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.db.session import get_db
from app.db.models import GuildSettings, OnboardingFlow, OnboardingStep, MemberOnboarding, OnboardingLog

router = APIRouter()

DEMO_GUILD_ID = "demo-guild-777"

@router.post("/seed")
async def seed_demo_data(db: AsyncSession = Depends(get_db)):
    stmt_g = select(GuildSettings).where(GuildSettings.guild_id == DEMO_GUILD_ID)
    res_g = await db.execute(stmt_g)
    guild = res_g.scalar_one_or_none()
    if not guild:
        guild = GuildSettings(
            guild_id=DEMO_GUILD_ID,
            guild_name="Developer Nexus Community",
            icon_url="https://cdn.discordapp.com/embed/avatars/0.png",
            is_enabled=True,
            completion_role_id="role-member-verified",
            reminder_delay_minutes=30,
            max_reminders=2
        )
        db.add(guild)
        await db.commit()

    stmt_f = select(OnboardingFlow).where(OnboardingFlow.guild_id == DEMO_GUILD_ID)
    res_f = await db.execute(stmt_f)
    flow = res_f.scalar_one_or_none()
    if not flow:
        flow = OnboardingFlow(
            guild_id=DEMO_GUILD_ID,
            title="New Member Guided Journey",
            description="Automated 5-step onboarding flow for developer community",
            is_active=True
        )
        db.add(flow)
        await db.commit()
        await db.refresh(flow)

        steps_data = [
            (
                "welcome_message",
                1,
                "Welcome to {{server_name}}!",
                "Hey {{username}}, welcome! You are member #{{member_count}}. Let's get you set up with the right roles and channels.",
                [{"key": "start", "label": "Start Onboarding", "emoji": "🚀"}]
            ),
            (
                "select_menu",
                2,
                "Select Your Primary Interests",
                "Choose what topics you'd like to discuss and receive notifications for:",
                [
                    {"key": "prog", "label": "Software Engineering", "description": "Python, TypeScript, Rust", "emoji": "💻", "role_id": "role-dev", "role_name": "Developer"},
                    {"key": "design", "label": "UI/UX & Product Design", "description": "Figma, Design Systems", "emoji": "🎨", "role_id": "role-designer", "role_name": "Designer"},
                    {"key": "ai", "label": "Machine Learning & AI", "description": "PyTorch, LLMs, Agents", "emoji": "🤖", "role_id": "role-ai", "role_name": "AI Specialist"},
                    {"key": "security", "label": "Cybersecurity & DevOps", "description": "AppSec, Kubernetes, Cloud", "emoji": "🛡️", "role_id": "role-sec", "role_name": "Security"}
                ]
            ),
            (
                "button_choice",
                3,
                "Choose Your Region",
                "Pick your region to unlock timezone-specific channels and event alerts:",
                [
                    {"key": "eu", "label": "Europe (EU)", "emoji": "🇪🇺", "role_id": "role-eu", "role_name": "Europe"},
                    {"key": "na", "label": "North America (NA)", "emoji": "🇺🇸", "role_id": "role-na", "role_name": "North America"},
                    {"key": "asia", "label": "Asia-Pacific (APAC)", "emoji": "🌏", "role_id": "role-apac", "role_name": "Asia-Pacific"}
                ]
            ),
            (
                "rules_confirm",
                4,
                "Community Guidelines & Rules",
                "1. Be respectful and constructive.\n2. No unsolicited self-promotion.\n3. Keep discussions in the relevant channels.",
                [{"key": "rules", "label": "I Accept Server Rules", "emoji": "✅"}]
            ),
            (
                "checklist_item",
                5,
                "Final Steps & Channel Unlock",
                "Confirm that you've reviewed #faq and are ready to unlock #general and community forums.",
                [{"key": "unlock", "label": "Unlock Community Channels", "emoji": "🔓", "role_id": "role-member-verified", "role_name": "Verified Member"}]
            )
        ]

        for s_type, s_order, s_title, s_desc, s_opts in steps_data:
            step = OnboardingStep(
                flow_id=flow.id,
                step_order=s_order,
                step_type=s_type,
                title=s_title,
                description=s_desc,
                options_json=json.dumps(s_opts)
            )
            db.add(step)
        await db.commit()

    sample_members = [
        ("user_101", "Alex_Dev", "completed", 5, ["role-dev", "role-eu", "role-member-verified"], 25),
        ("user_102", "Sarah_UI", "completed", 5, ["role-designer", "role-na", "role-member-verified"], 15),
        ("user_103", "CyberKev", "in_progress", 2, ["role-sec"], None),
        ("user_104", "DataNinja", "in_progress", 3, ["role-ai", "role-apac"], None),
        ("user_105", "NewbieCoder", "not_started", 0, [], None),
    ]

    now = datetime.datetime.utcnow()
    for uid, uname, status, c_step, roles, duration in sample_members:
        stmt_m = select(MemberOnboarding).where(and_(MemberOnboarding.guild_id == DEMO_GUILD_ID, MemberOnboarding.user_id == uid))
        res_m = await db.execute(stmt_m)
        if not res_m.scalar_one_or_none():
            completed_dt = now - datetime.timedelta(minutes=10) if status == "completed" else None
            joined_dt = now - datetime.timedelta(minutes=(duration + 10) if duration else 45)
            db.add(MemberOnboarding(
                guild_id=DEMO_GUILD_ID,
                user_id=uid,
                username=uname,
                avatar_url=f"https://api.dicebear.com/7.x/bottts/svg?seed={uname}",
                current_step_index=c_step,
                status=status,
                assigned_role_ids_json=json.dumps(roles),
                joined_at=joined_dt,
                completed_at=completed_dt
            ))

    await db.commit()
    return {"message": "Demo data seeded successfully for demo-guild-777"}
