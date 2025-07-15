from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class QuizAutoCreate(BaseModel):
    title: str
    questions: List[Dict[str, Any]]  # each question is a dict