from pydantic import BaseModel

class QuizAttemptCreate(BaseModel):
    user_id: int
    quiz_id: int
