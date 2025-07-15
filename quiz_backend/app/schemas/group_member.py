from pydantic import BaseModel, EmailStr

class GroupMemberCreate(BaseModel):
    email: EmailStr

class GroupMemberOut(BaseModel):
    id: int
    group_id: int
    email: EmailStr

    class Config:
        orm_mode = True
