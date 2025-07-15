from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from ..models.question import Question  # Import the Question schema
from datetime import date 

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    time_limit: int
    questions: List[Question]  # This is the list of Question objects
    is_active: Optional[bool] = Field(default=False)
    source_quiz_id: Optional[int] = None   # ✅ new
    active_till: Optional[date] = None     # ✅ new

class QuizCreate(QuizBase):
    pass

class QuizOut(QuizBase):
    id: int
    is_active: bool
    questions: List[Question]
    has_question_timers: bool = True  # Questions will be automatically parsed

    class Config:
        orm_mode = True  # Ensure SQLAlchemy models are parsed correctly

class QuizAssignedOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    time_limit: int
    is_active: bool
    total_questions: int
    has_attempted: bool
    active_till: Optional[datetime]

    class Config:
        orm_mode = True


