import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.db.base import Base


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


class RoleMapping(Base):
    __tablename__ = "role_mappings"

    id = Column(Integer, primary_key=True, index=True)
    guild_id = Column(String(32), index=True, nullable=False)
    step_id = Column(Integer, nullable=False, index=True)
    option_key = Column(String(64), nullable=False)
    role_id = Column(String(32), nullable=False)
    role_name = Column(String(128), nullable=False)
