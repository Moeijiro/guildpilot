from pydantic import BaseModel, Field
from typing import Optional, List, Any
import datetime

class StepOption(BaseModel):
    key: str
    label: str
    description: Optional[str] = None
    emoji: Optional[str] = None
    role_id: Optional[str] = None
    role_name: Optional[str] = None

class StepCreate(BaseModel):
    step_type: str = Field(..., description="welcome_message, button_choice, select_menu, rules_confirm, role_selection, checklist_item")
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=2)
    step_order: Optional[int] = None
    options: Optional[List[StepOption]] = None

class StepUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[StepOption]] = None

class StepOut(BaseModel):
    id: int
    flow_id: int
    step_order: int
    step_type: str
    title: str
    description: str
    options: List[StepOption] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FlowCreate(BaseModel):
    title: str
    description: Optional[str] = None

class FlowOut(BaseModel):
    id: int
    guild_id: str
    title: str
    description: Optional[str]
    is_active: bool
    steps: List[StepOut] = []
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class FlowReorder(BaseModel):
    step_ids_order: List[int]
