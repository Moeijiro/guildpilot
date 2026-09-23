import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.session import Base

class GuildSettings(Base):
    __tablename__ = "guild_settings"

    guild_id = Column(String(32), primary_key=True, index=True)
    guild_name = Column(String(255), nullable=False)
    icon_url = Column(String(512), nullable=True)
    is_enabled = Column(Boolean, default=True)
    completion_role_id = Column(String(32), nullable=True)
    reminder_delay_minutes = Column(Integer, default=30)
    max_reminders = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    flows = relationship("OnboardingFlow", back_populates="guild", cascade="all, delete-orphan")

class OnboardingFlow(Base):
    __tablename__ = "onboarding_flows"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), ForeignKey("guild_settings.guild_id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    guild = relationship("GuildSettings", back_populates="flows")
    steps = relationship("OnboardingStep", back_populates="flow", cascade="all, delete-orphan", order_by="OnboardingStep.step_order")

class OnboardingStep(Base):
    __tablename__ = "onboarding_steps"

    id = Column(Integer, primary_key=True, index=True)
    flow_id = Column(Integer, ForeignKey("onboarding_flows.id"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False, default=1)
    step_type = Column(String(32), nullable=False)  # welcome_message, button_choice, select_menu, rules_confirm, role_selection, checklist_item
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    options_json = Column(Text, nullable=True)  # JSON formatted options / choices
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    flow = relationship("OnboardingFlow", back_populates="steps")

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

class RoleMapping(Base):
    __tablename__ = "role_mappings"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    step_id = Column(Integer, nullable=False, index=True)
    option_key = Column(String(64), nullable=False)
    role_id = Column(String(32), nullable=False)
    role_name = Column(String(128), nullable=False)

class OnboardingLog(Base):
    __tablename__ = "onboarding_logs"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    user_id = Column(String(32), index=True, nullable=False)
    event_type = Column(String(64), nullable=False)  # onboarding_started, step_completed, role_assigned, onboarding_finished, onboarding_reset, reminder_sent, error
    details = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
