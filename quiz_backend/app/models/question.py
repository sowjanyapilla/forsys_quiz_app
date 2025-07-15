from pydantic import BaseModel
from typing import List, Optional

class Question(BaseModel):
    question: str
    options: List[str]
    correct: int
    time_limit: int
