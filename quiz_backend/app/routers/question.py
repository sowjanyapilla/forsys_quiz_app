# Importing required modules and dependencies
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from ..database import get_db    # For getting the database session
from ..models.quiz import Quiz
from ..dependencies import get_current_admin

# Creating a router for question-related operations
router = APIRouter(prefix="/questions", tags=["questions"])

@router.get("/{quiz_id}")
async def get_questions(
    quiz_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches the questions JSON for a given quiz_id
    """

    # Create SQL query to select the quiz by ID
    stmt = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()  # Get single result or None

    # If quiz is not found, raise 404 error
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Return quiz data
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

    # Create SQL query to select the quiz by ID
    stmt = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()

    # If quiz not found, raise 404 error
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Update the questions_json field of the quiz
    quiz.questions_json = payload
    await db.commit()
    return {"message": "Questions updated successfully."}
