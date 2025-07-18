# FastAPI and SQLAlchemy imports
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from datetime import datetime, timezone
import traceback

# Internal imports
from ..database import get_db    # Dependency to get DB session
from ..models.quiz import Quiz
from ..schemas.quiz import QuizCreate, QuizOut, QuizAssignedOut
from ..dependencies import get_current_user     # Auth dependency
from ..models.submission import Submission
from ..models.question import Question
from ..models.quiz_access import QuizAccess
from ..schemas.feedback import FeedbackCreate
from ..models.feedback import Feedback
from ..models.user import User
from ..schemas.submission import SubmissionCreate, SubmissionUpdate


# Router definition
router = APIRouter(prefix="/quizzes", tags=["quizzes"])

#for manually created quiz(not automated)
@router.post("/", response_model=QuizOut)
async def create_quiz(quiz: QuizCreate, db: AsyncSession = Depends(get_db)):
    db_quiz = Quiz(
        title=quiz.title,
        description=quiz.description,
        questions_json=quiz.questions_json,
        is_active=True
    )
    db.add(db_quiz)
    await db.commit()
    await db.refresh(db_quiz)
    return QuizOut(
        id=db_quiz.id,
        title=db_quiz.title,
        description=db_quiz.description,
        is_active=db_quiz.is_active,
        time_limit=db_quiz.time_limit,
        created_at=db_quiz.created_at,
        questions=[
            Question(**q) for q in db_quiz.questions_json
        ]
    )

#public list of all quizes
@router.get("/", response_model=list[QuizOut])
async def list_quizzes(db: AsyncSession = Depends(get_db)):
    now = datetime.now(timezone.utc)
    result = await db.execute(select(Quiz))
    quizzes = result.scalars().all()
    quiz_out_list = []
    for quiz in quizzes:

        # Deactivate expired quizzes
        if quiz.active_till and quiz.active_till < now and quiz.is_active:
            quiz.is_active = False
            db.add(quiz)

        # Ensure questions are deserialized
        questions_data = quiz.questions_json
        if isinstance(questions_data, str):
            import json
            questions_data = json.loads(questions_data)
        
        # Build response list
        quiz_out_list.append(
            QuizOut(
                id=quiz.id,
                title=quiz.title,
                description=quiz.description,
                is_active=quiz.is_active,
                time_limit=quiz.time_limit,
                created_at=quiz.created_at,
                active_till=quiz.active_till,
                questions=[
                    Question(**q) for q in questions_data
                ]
            )
        )
    await db.commit()
    return quiz_out_list


#toggle functionality before adding active date functionality
@router.patch("/{quiz_id}/toggle")
async def toggle_quiz(quiz_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_active = not quiz.is_active
    await db.commit()
    return {"status": "success", "is_active": quiz.is_active}


#showing assigned quizzes with status
@router.get("/assigned", response_model=list[QuizAssignedOut])
async def assigned_quizzes(user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    #Get quizzes assigned to user
    stmt = (
        select(Quiz)
        .join(QuizAccess, QuizAccess.quiz_id == Quiz.id)
        .where(Quiz.is_active == True)
        .where(QuizAccess.user_id == user.id)
    )
    result = await db.execute(stmt)
    quizzes = result.scalars().all()

    # Get previously attempted quizzes
    attempted = await db.execute(
        select(Submission.quiz_id).where(Submission.user_id == user.id)
    )
    attempted_ids = {row[0] for row in attempted.all()}

    # Build response list with attempt status
    result_list = []
    for quiz in quizzes:
        result_list.append({
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "time_limit": quiz.time_limit,
            "is_active": quiz.is_active,
            "active_till": quiz.active_till,
            "total_questions": len(quiz.questions_json or []),
            "has_attempted": quiz.id in attempted_ids,
            
        })
    return result_list

@router.get("/{quiz_id}", response_model=QuizOut)
async def get_quiz(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalar_one_or_none()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    return QuizOut(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        is_active=quiz.is_active,
        time_limit=quiz.time_limit,
        created_at=quiz.created_at,
        has_question_timers=True,
        questions=[
            Question(**q) for q in quiz.questions_json
        ]
    )


#for submission update
@router.post("/{quiz_id}/submit")
async def submit_quiz(quiz_id: int, submission: SubmissionUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Log the incoming data
        print("Incoming submission payload:", submission)

        # Fetch the existing submission
        result = await db.execute(
            select(Submission).where(
                Submission.id == submission.submission_id,
                Submission.user_id == current_user.id,
                Submission.quiz_id == quiz_id,
            )
        )
        sub = result.scalars().first()
        if not sub:
            raise HTTPException(status_code=404, detail="Submission not found")

        #Update submission fields
        sub.answers = submission.answers
        sub.score = submission.score
        sub.correct_count = submission.correct_count
        sub.incorrect_count = submission.incorrect_count
        sub.not_attempted_count = submission.not_attempted_count
        sub.time_taken = submission.time_taken
        sub.started_at = submission.started_at
        sub.submitted_at = datetime.now(timezone.utc)

        db.add(sub)  
        await db.commit()
        return {"message": "Submission recorded successfully."}

    except Exception as e:
        print("❌ Exception during quiz submission:")
        traceback.print_exc()  # Logs full stack trace
        raise HTTPException(status_code=400, detail="Failed to submit quiz.")


@router.post("/submit-feedback")
async def submit_feedback(
    feedback: FeedbackCreate,  # pydantic model with quiz_id and feedback_text
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    print(f"💬 Feedback from {current_user.id} on quiz {feedback.quiz_id}: {feedback.feedback_text}")
    new_feedback = Feedback(
        quiz_id=feedback.quiz_id,
        user_id=current_user.id,
        feedback_text=feedback.feedback_text
    )
    session.add(new_feedback)
    await session.commit()
    return {"message": "Feedback received"}
