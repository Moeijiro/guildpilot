import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


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
