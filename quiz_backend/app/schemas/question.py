# question.py
from pydantic import BaseModel
from typing import List

class Question(BaseModel):
    question_text: str  # The question text
    answer_choices: List[str]  # List of answer choices
    correct_answer: str  # The correct answer

    class Config:
        orm_mode = True  # This allows SQLAlchemy models to be converted to Pydantic models
