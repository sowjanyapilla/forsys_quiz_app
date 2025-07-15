# # app/routers/quiz_attempt.py

# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session
# from datetime import datetime
# from ..database import get_db
# from ..models.quiz_attempt import QuizAttempt
# from ..schemas.quiz_attempt import QuizAttemptCreate

# router = APIRouter(prefix="/quiz_attempts", tags=["quiz_attempts"])

# @router.post("/")
# def create_quiz_attempt(attempt: QuizAttemptCreate, db: Session = Depends(get_db)):
#     db_attempt = QuizAttempt(
#         user_id=attempt.user_id,
#         quiz_id=attempt.quiz_id,
#         started_at=datetime.utcnow()
#     )
#     db.add(db_attempt)
#     db.commit()
#     db.refresh(db_attempt)
#     return {"message": "Quiz attempt recorded", "attempt_id": db_attempt.id}
