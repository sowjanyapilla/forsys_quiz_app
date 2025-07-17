
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models.submission import Submission
from ..models.user import User
from ..models.quiz import Quiz
from ..dependencies import get_current_user

# Create a router with a prefix specific to leaderboard operations for quizzes
router = APIRouter(prefix="/quizzes/{quiz_id}/leaderboard", tags=["leaderboard"])

# Helper function to format time (in seconds) into "Xm Ys" string format
def format_time(seconds: float | None) -> str:
    if seconds is None:
        return "-"   # If no time is recorded, show a fallback string
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes}m {remaining_seconds}s"

# Endpoint: Get the top 3 leaderboard entries for a specific quiz
@router.get("")
async def get_leaderboard(quiz_id: int, db: AsyncSession = Depends(get_db)):
     # Verify if the quiz with the given ID exists
    quiz = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Select submissions for this quiz, joining user details, and order by score and time
    stmt = (
        select(Submission, User)
        .join(User, Submission.user_id == User.id)
        .where(Submission.quiz_id == quiz_id)
        .order_by(Submission.score.desc(), Submission.time_taken.asc())
    )
    result = await db.execute(stmt)
    results = result.all() # List of tuples: (Submission, User)

    # Build a leaderboard response
    leaderboard = []
    for sub, user in results:
        leaderboard.append({
            "username": user.full_name,
            "email": user.email,
            "score": sub.score,
            "correct_count": sub.correct_count,
            "incorrect_count": sub.incorrect_count,
            "not_attempted_count": sub.not_attempted_count,
            "time_taken": sub.time_taken if sub.time_taken is not None else 0.0,  # always a float
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
        })

    # Return top 3 users and others separately
    return {
        "quiz_id": quiz_id,
        "top_3": leaderboard[:3],
        "others": leaderboard[3:],
    }

#Endpoint: Get full leaderboard with ranks and identify current user
@router.get("/full")
async def get_full_leaderboard(quiz_id: int, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):

    # Verify if the quiz with the given ID exists
    quiz = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    # Load all submissions with associated user details, ordered by score and time
    stmt = (
        select(Submission)
        .options(joinedload(Submission.user))
        .where(Submission.quiz_id == quiz_id)
        .order_by(Submission.score.desc(), Submission.time_taken.asc())
    )
    result = await db.execute(stmt)
    submissions = result.scalars().all()

    # Build full leaderboard with rank and highlight current user
    leaderboard = []
    for idx, sub in enumerate(submissions):
        leaderboard.append({
            "rank": idx + 1,
            "full_name": sub.user.full_name,
            "score": sub.score,
            "correct_count": sub.correct_count,
            "incorrect_count": sub.incorrect_count,
            "not_attempted_count": sub.not_attempted_count,
            "time_taken": sub.time_taken if sub.time_taken is not None else 0.0,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "is_current_user": sub.user_id == current_user.id, # True if logged-in user
        })

    return leaderboard
