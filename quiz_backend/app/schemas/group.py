from pydantic import BaseModel
from datetime import datetime

class GroupBase(BaseModel):
    name: str

class GroupCreate(GroupBase):
    pass

class GroupOut(GroupBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
