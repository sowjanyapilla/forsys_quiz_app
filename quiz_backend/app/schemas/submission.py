
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
from typing import Optional

class SubmissionCreate(BaseModel):
    quiz_id: int 
    answers: Dict[str, Any]
    score: int
    correct_count: int
    incorrect_count: int
    not_attempted_count: int
    time_taken: float
    started_at: Optional[datetime] = None

class SubmissionOut(BaseModel):
    id: int
    user_id: int
    quiz_id: int
    score: Optional[int]
    answers: Optional[Dict[str, Any]] = None
    correct_count: Optional[int]
    incorrect_count: Optional[int]
    not_attempted_count: Optional[int]
    time_taken: Optional[float] = None
    submitted_at: datetime
    user_name: str
    quiz_title: str
    
    class Config:
        orm_mode = True

from pydantic import BaseModel
from typing import Dict

class SubmissionUpdate(BaseModel):
    submission_id: int
    answers: Dict[str, int]
    score: int
    correct_count: int
    incorrect_count: int
    not_attempted_count: int
    time_taken: float
    started_at: datetime

