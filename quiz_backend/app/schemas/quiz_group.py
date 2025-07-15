from pydantic import BaseModel

class QuizGroupCreate(BaseModel):
    quiz_id: int
    group_id: int

class QuizGroupOut(BaseModel):
    id: int
    quiz_id: int
    group_id: int

    class Config:
        orm_mode = True
