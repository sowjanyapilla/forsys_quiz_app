# quiz_backend/app/routers/question.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db
from ..models.quiz import Quiz
from ..dependencies import get_current_admin

router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/{quiz_id}")
async def get_questions(
    quiz_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the questions JSON for a given quiz_id
    """
    stmt = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return {
        "quiz_id": quiz.id,
        "title": quiz.title,
        "questions": quiz.questions_json
    }

@router.put("/{quiz_id}")
async def update_questions(
    quiz_id: int,
    payload: dict,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the questions JSON for a given quiz_id
    """
    stmt = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz.questions_json = payload
    await db.commit()
    return {"message": "Questions updated successfully."}
