from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from ..database import get_db
from ..models.user import User
from ..models.quiz import Quiz
from ..models.submission import Submission
from ..dependencies import get_current_user

router = APIRouter(prefix="/user", tags=["user"])


@router.get("/me")
async def get_user_profile(user=Depends(get_current_user)):
    """
    Returns current logged-in user's profile
    """
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "full_name": user.full_name,
        "email": user.email,
        "is_admin": user.is_admin
    }


@router.get("/quizzes")
async def get_user_quizzes(
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    List active quizzes assigned to this user
    """
    result = await session.execute(
        text("""
            SELECT q.*
            FROM quiz_access qa
            JOIN quizzes q ON q.id = qa.quiz_id
            WHERE qa.user_id = :user_id AND q.is_active = true
        """),
        {"user_id": user.id}
    )
    quizzes = result.mappings().all()  # fetch rows as dict-like
    return [dict(q) for q in quizzes]


@router.get("/submissions")
async def get_my_submissions(
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    """
    Get all submissions of the current user
    """
    result = await session.execute(
        select(Submission).where(Submission.user_id == user.id)
    )
    submissions = result.scalars().all()
    return submissions
