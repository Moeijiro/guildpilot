import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from app.db.base import Base


class MemberOnboarding(Base):
    __tablename__ = "member_onboardings"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    user_id = Column(String(32), index=True, nullable=False)
    username = Column(String(128), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    current_step_index = Column(Integer, default=0)
    status = Column(String(32), default="not_started")  # not_started, in_progress, completed, expired
    selected_data_json = Column(Text, default="{}")
    assigned_role_ids_json = Column(Text, default="[]")
    reminders_sent = Column(Integer, default=0)
    last_reminder_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("ix_member_guild_user", "guild_id", "user_id", unique=True),
    )


class OnboardingLog(Base):
    __tablename__ = "onboarding_logs"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    user_id = Column(String(32), index=True, nullable=False)
    event_type = Column(String(64), nullable=False)  # onboarding_started, step_completed, role_assigned, onboarding_finished, onboarding_reset, reminder_sent, error
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
