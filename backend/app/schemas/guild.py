from pydantic import BaseModel
from typing import Optional, List
import datetime

class GuildSettingsOut(BaseModel):
    guild_id: str
    guild_name: str
    icon_url: Optional[str]
    is_enabled: bool
    completion_role_id: Optional[str]
    reminder_delay_minutes: int
    max_reminders: int

    class Config:
        from_attributes = True

class OverviewMetricsOut(BaseModel):
    new_members_count: int
    completion_rate_percentage: float
    incomplete_count: int
    average_completion_minutes: float
    recent_members: List[dict]
