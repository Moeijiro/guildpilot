from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

class MemberProgressOut(BaseModel):
    id: int
    guild_id: str
    user_id: str
    username: Optional[str]
    avatar_url: Optional[str]
    current_step_index: int
    total_steps: int
    status: str  # not_started, in_progress, completed, expired
    selected_data: Dict[str, Any]
    assigned_roles: List[str]
    joined_at: datetime.datetime
    completed_at: Optional[datetime.datetime]
    progress_percentage: int

class OnboardingLogOut(BaseModel):
    id: int
    guild_id: str
    user_id: str
    event_type: str
    details: str
    timestamp: datetime.datetime

    class Config:
        from_attributes = True
