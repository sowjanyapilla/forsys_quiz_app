# Imports for FastAPI and SQLAlchemy
from app.utils.websocket_manager import manager
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession, session
from sqlalchemy.future import select
from sqlalchemy import select
from sqlalchemy import cast, Integer
from uuid import UUID
from dateutil.parser import parse as parse_datetime
from datetime import datetime, timezone

# Local module imports
from ..database import get_db
from ..models.submission import Submission
from ..schemas.submission import SubmissionCreate, SubmissionOut
from ..models.quiz import Quiz
from ..models.user import User
from ..dependencies import get_current_user
from ..utils.websocket_manager import manager

# Create a FastAPI router for submission-related endpoints
router = APIRouter(prefix="/submissions", tags=["submissions"])


#for submission create, finalize a started quiz, Calculates time_taken from started_at, return full submission details with metadata
@router.post("/", response_model=SubmissionOut)
async def submit_quiz(
    submission: SubmissionCreate,
    session: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
     # Fetch the started submission for the user and quiz
    submission_query = await session.execute(
        select(Submission).where(
            Submission.quiz_id == submission.quiz_id,
            Submission.user_id == user.id
        )
    )
    sub = submission_query.scalar_one_or_none()

    if not sub:
        raise HTTPException(status_code=404, detail="No started submission found for this quiz")

     # Parse or reuse the started_at timestamp, calculate time_taken
    submitted_at = datetime.now(timezone.utc)
    sub.submitted_at = submitted_at
    print(f"🧪 submission.started_at received: {submission.started_at} ({type(submission.started_at)})")
    try:
        if not sub.started_at:
            sub.started_at = (
                parse_datetime(submission.started_at)
                if isinstance(submission.started_at, str)
                else submission.started_at
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid start time: {e}")
    time_taken = (submitted_at - sub.started_at).total_seconds()
    sub.time_taken = time_taken

    # Update scoring-related fields
    sub.score = submission.score
    sub.correct_count = submission.correct_count
    sub.incorrect_count = submission.incorrect_count
    sub.not_attempted_count = submission.not_attempted_count

    # Commit changes to DB
    session.add(sub)
    print("Setting started_at to:", sub.started_at)
    await session.commit()
    await session.refresh(sub)

    # Fetch related user and quiz for response metadata
    user_query = await session.execute(select(User).where(User.id == sub.user_id))
    user_obj = user_query.scalar_one_or_none()

    quiz_query = await session.execute(select(Quiz).where(Quiz.id == sub.quiz_id))
    quiz_obj = quiz_query.scalar_one_or_none()

    if not user_obj or not quiz_obj:
        raise HTTPException(status_code=400, detail="Related user or quiz not found")

    # Broadcast update via WebSocket (e.g., leaderboard refresh)
    await manager.broadcast(
        f"New submission for quiz {submission.quiz_id}, please refresh leaderboard"
    )

    return SubmissionOut(
        id=sub.id,
        user_id=sub.user_id,
        quiz_id=sub.quiz_id,
        score=sub.score,
        correct_count=sub.correct_count,
        incorrect_count=sub.incorrect_count,
        not_attempted_count=sub.not_attempted_count,
        time_taken=sub.time_taken,
        submitted_at=sub.submitted_at,
        started_at=sub.started_at,
        user_name=user_obj.full_name,
        quiz_title=quiz_obj.title,
    )


@router.get("/", response_model=list[SubmissionOut])
async def list_submissions(
    quiz: str = None,
    session: AsyncSession = Depends(get_db)
):
    try:
        query = (
            select(
                Submission.id,
                Submission.user_id,
                Submission.quiz_id,
                Submission.score,
                Submission.correct_count,
                Submission.incorrect_count,
                Submission.not_attempted_count,
                Submission.time_taken,
                Submission.submitted_at,
                Submission.started_at,
                User.full_name.label("user_name"),
                Quiz.title.label("quiz_title"),
            )
            .join(User, Submission.user_id == User.id)
            .join(Quiz, Submission.quiz_id == Quiz.id)
            .order_by(Submission.submitted_at.desc())
        )

        # Optional filtering by quiz ID
        if quiz:
            query = query.where(cast(Submission.quiz_id, Integer) == int(quiz))

        res = await session.execute(query)
        rows = res.all()

        return [
            SubmissionOut(
                id=row.id,
                user_id=row.user_id,
                quiz_id=row.quiz_id,
                score=row.score,
                correct_count=row.correct_count,
                incorrect_count=row.incorrect_count,
                not_attempted_count=row.not_attempted_count,
                time_taken=row.time_taken,
                submitted_at=row.submitted_at,
                started_at=row.started_at,
                user_name=row.user_name,
                quiz_title=row.quiz_title,
            )
            for row in rows
        ]

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{submission_id}", response_model=SubmissionOut)
async def get_submission(
    submission_id: int,
    session: AsyncSession = Depends(get_db)
):
    q = select(Submission).where(Submission.id == submission_id)
    res = await session.execute(q)
    sub = res.scalar_one_or_none()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    # fetch related user and quiz for full response
    user_query = await session.execute(select(User).where(User.id == sub.user_id))
    user_obj = user_query.scalar_one_or_none()

    quiz_query = await session.execute(select(Quiz).where(Quiz.id == sub.quiz_id))
    quiz_obj = quiz_query.scalar_one_or_none()

    if not user_obj or not quiz_obj:
        raise HTTPException(status_code=400, detail="Related user or quiz not found")

    return SubmissionOut(
        id=sub.id,
        user_id=sub.user_id,
        quiz_id=sub.quiz_id,
        score=sub.score,
        correct_count=sub.correct_count,
        incorrect_count=sub.incorrect_count,
        not_attempted_count=sub.not_attempted_count,
        time_taken=sub.time_taken,
        submitted_at=sub.submitted_at,
        started_at=sub.started_at,
        user_name=user_obj.full_name,
        quiz_title=quiz_obj.title,
    )


@router.post("/start/{quiz_id}", status_code=status.HTTP_201_CREATED)
async def start_quiz(
    quiz_id: int,
    user=Depends(get_current_user),
    session: AsyncSession = Depends(get_db)
):
    
    # Creates a new submission record to mark the start of a quiz attempt.
    quiz_query = await session.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_query.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    sub = Submission(
        user_id=user.id,
        quiz_id=quiz_id,
        started_at=datetime.now(timezone.utc),
        time_taken=0.0,
    )
    session.add(sub)
    await session.commit()
    await session.refresh(sub)

    return {
        "status": "success",
        "submission_id": sub.id,
        "started_at": sub.started_at
    }
