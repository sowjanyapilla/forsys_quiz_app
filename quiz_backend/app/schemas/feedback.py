from pydantic import BaseModel

class FeedbackCreate(BaseModel):
    quiz_id: int
    feedback_text: str
