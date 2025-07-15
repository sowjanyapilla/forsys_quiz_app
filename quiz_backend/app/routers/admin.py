# app/routers/admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, delete
from ..database import get_db
from ..models.quiz import Quiz
from ..models.user import User
from ..models.submission import Submission
from ..schemas.quiz import QuizCreate
from ..dependencies import get_current_admin
from ..schemas.assignment import UserAssignment
from .. import models
from app.models.quiz_access import QuizAccess
# admin.py
from ..email import fast_mail
from fastapi_mail import MessageSchema, MessageType
from typing import List
from fastapi import Body
from datetime import datetime, timezone
import urllib.parse

# app/routers/admin.py
from fastapi.responses import StreamingResponse
import io
import pandas as pd
from app.models.feedback import Feedback
from fastapi import Query


router = APIRouter(prefix="/admin", tags=["admin"])


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from ..database import get_db
from ..models.quiz import Quiz
from ..schemas.quiz import QuizCreate
from ..models.quiz_auto import AutoQuiz
from ..models.group_member import GroupMember

router = APIRouter(prefix="/admin", tags=["admin"])

from sqlalchemy import insert

# @router.post("/create-quiz-automated")
# async def create_quiz_automated(
#     payload: QuizAutoCreate,
#     db: AsyncSession = Depends(get_db)
# ):
#     try:
#         quiz = AutoQuiz(
#             title=payload.title,
#             questions=payload.questions
#         ) 
#         db.add(quiz)
#         await db.commit()
#         await db.refresh(quiz)
#         return {"message": "Automated quiz created successfully", "quiz_id": quiz.id}
#     except Exception as e:
#         print("🔥 Error in create_quiz_automated:", repr(e))
#         raise HTTPException(status_code=500, detail="Failed to create automated quiz.")

@router.post("/create-group")
async def create_group(
    name: str = Body(...),
    emails: List[str] = Body(...),
    db: AsyncSession = Depends(get_db)
):
    # Create group
    group = models.Group(name=name)
    db.add(group)
    await db.flush()

    # Fetch users
    result = await db.execute(select(User).where(User.email.in_(emails)))
    users = result.scalars().all()

    if len(users) != len(emails):
        raise HTTPException(status_code=400, detail="Some emails are not registered users")

    # Add members
    for user in users:
        db.add(models.GroupMember(group_id=group.id, user_id=user.id))

    await db.commit()
    return {"message": "Group created", "group_id": group.id}

@router.get("/groups")
async def get_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.Group))
    groups = result.scalars().all()
    return [{"id": g.id, "name": g.name} for g in groups]

@router.get("/groups/{group_id}/members")
async def get_group_members(group_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User.email)
        .join(GroupMember, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id)
    )
    emails = [row[0] for row in result.all()]
    return emails

@router.put("/groups/{group_id}/members")
async def update_group_members(group_id: int, emails: List[str] = Body(...), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(GroupMember).where(GroupMember.group_id == group_id))

    result = await db.execute(select(User).where(User.email.in_(emails)))
    users = result.scalars().all()

    for user in users:
        db.add(GroupMember(group_id=group_id, user_id=user.id))

    await db.commit()
    return {"message": "Group updated"}

@router.post("/assign-quiz-to-group/{quiz_id}/{group_id}")
async def assign_quiz_to_group(
    quiz_id: int,
    group_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    # Get users in the group
    result = await db.execute(
        select(User.id)
        .join(GroupMember, GroupMember.user_id == User.id)
        .where(GroupMember.group_id == group_id)
    )
    user_ids = [row[0] for row in result.all()]

    # Insert into quiz_access
    for user_id in user_ids:
        await db.execute(
            text(
                "INSERT INTO quiz_access (user_id, quiz_id) VALUES (:user_id, :quiz_id) ON CONFLICT DO NOTHING"
            ),
            {"user_id": user_id, "quiz_id": quiz_id}
        )

    await db.commit()
    return {"message": f"Quiz {quiz_id} assigned to group {group_id}."}


@router.post("/create-quiz")
async def create_quiz(
    payload: QuizCreate,
    db: AsyncSession = Depends(get_db)
):
    quiz = Quiz(
        title=payload.title,
        description=payload.description,
        questions_json=[q.dict() for q in payload.questions],  # Convert Pydantic Question to dict
        time_limit=payload.time_limit,
        is_active=True,
        source_quiz_id=payload.source_quiz_id,
        active_till=payload.active_till
    )
    db.add(quiz)
    await db.commit()
    await db.refresh(quiz)
    return {"message": "Quiz created successfully", "quiz_id": quiz.id}

from app.models.quiz_auto import AutoQuiz  # ✅ make sure this is imported

@router.get("/quiz-templates")
async def get_quiz_templates(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AutoQuiz))
    quizzes = result.scalars().all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "total_questions": len(q.questions or [])
        }
        for q in quizzes
    ]

@router.get("/quiz-template/{quiz_id}")
async def get_quiz_template(quiz_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AutoQuiz).where(AutoQuiz.id == quiz_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Template not found")
    return {
        "id": quiz.id,
        "title": quiz.title,
        "questions": quiz.questions or []
    }


@router.get("/quizzes")
async def list_quizzes(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(Quiz))
    quizzes = result.scalars().all()

    now = datetime.now(timezone.utc)
    updated = False
    for quiz in quizzes:
        # Only auto-deactivate quizzes that were not manually reactivated after expiry
        if quiz.active_till and quiz.active_till < now and quiz.is_active and not quiz.manual_override_quiz_active:
            quiz.is_active = False

            db.add(quiz)
            updated = True

    if updated:
        await db.commit()  # Save any status change

    active = [q for q in quizzes if q.is_active]
    inactive = [q for q in quizzes if not q.is_active]

    return {
        "active_quizzes": [
            {
                "id": q.id,
                "title": q.title,
                "description": q.description,
                "created_at": q.created_at,
                "is_active": q.is_active,
                "total_questions": len(q.questions_json or []),
                "active_till": q.active_till
            }
            for q in active
        ],
        "inactive_quizzes": [
            {
                "id": q.id,
                "title": q.title,
                "description": q.description,
                "created_at": q.created_at,
                "is_active": q.is_active,
                "total_questions": len(q.questions_json or []),
                "active_till": q.active_till
            }
            for q in inactive
        ]
    }


@router.post("/assign-quiz/{quiz_id}")
async def assign_quiz(
    quiz_id: int,
    assignment: UserAssignment,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    for user_id in assignment.user_ids:
        await db.execute(
            text(
                "INSERT INTO quiz_access (user_id, quiz_id) VALUES (:user_id, :quiz_id) ON CONFLICT DO NOTHING"
            ),
            {"user_id": int(user_id), "quiz_id": quiz_id}  # force int
        )
    await db.commit()
    return {"message": f"Quiz {quiz_id} assigned to selected users."}


@router.patch("/toggle-quiz/{quiz_id}")
async def toggle_quiz(
    quiz_id: int,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz.is_active = not quiz.is_active
    quiz.manual_override_quiz_active = True
    await db.commit()
    return {"message": f"Quiz {quiz_id} is now {'active' if quiz.is_active else 'inactive'}."}


@router.get("/users")
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(User).where(User.is_admin == False))
    users = result.scalars().all()
    return [
        {"id": u.id, "full_name": u.full_name, "email": u.email}
        for u in users
    ]


@router.get("/submissions")
async def list_submissions(
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(
        select(
            Submission.id,
            Submission.score,
            Submission.submitted_at,
            User.full_name,
            Quiz.title.label("quiz_title")
        )
        .join(User, Submission.user_id == User.id)
        .join(Quiz, Submission.quiz_id == Quiz.id)
        .order_by(Submission.submitted_at.desc())
        .limit(limit)
    )
    rows = result.all()
    return [
        {
            "id": row.id,
            "full_name": row.full_name,
            "quiz_title": row.quiz_title,
            "score": row.score,
            "submitted_at": row.submitted_at.isoformat()
        }
        for row in rows
    ]



@router.get("/quiz-status/{quiz_id}")
async def get_quiz_status(quiz_id: int, db: AsyncSession = Depends(get_db)):
    try:
        # Fetch quiz title
        quiz_result = await db.execute(select(Quiz.title).where(Quiz.id == quiz_id))
        quiz_title_row = quiz_result.first()
        quiz_title = quiz_title_row[0] if quiz_title_row else "Untitled Quiz"

        # Assigned users
        assigned_users_result = await db.execute(
            select(User.id, User.full_name, User.email)
            .join(QuizAccess, QuizAccess.user_id == User.id)
            .where(QuizAccess.quiz_id == quiz_id)
        )
        assigned_users = assigned_users_result.all()

        # Attempted user IDs
        submitted_user_ids_result = await db.execute(
            select(Submission.user_id)
            .where(Submission.quiz_id == quiz_id)
            .distinct()
        )
        submitted_user_ids = {uid for (uid,) in submitted_user_ids_result.all()}

        attempted = []
        pending = []

        for user in assigned_users:
            user_data = {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email
            }
            if user.id in submitted_user_ids:
                attempted.append(user_data)
            else:
                pending.append(user_data)

        return {
            "quiz_title": quiz_title,
            "total_assigned": len(assigned_users),
            "attempted": attempted,
            "pending": pending
        }

    except Exception as e:
        print("🔥 Error in get_quiz_status:", repr(e))
        raise HTTPException(status_code=500, detail="Internal Server Error")



@router.post("/send-followup-email/{quiz_id}")
async def send_followup_email(
    quiz_id: int,
    payload: dict = Body(...),
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    try:
        emails: List[str] = payload.get("emails", [])
        quiz_title: str = payload.get("quiz_title", "a quiz")

        if not emails:
            raise HTTPException(status_code=400, detail="No emails provided.")

        message = MessageSchema(
            subject=f"Reminder: Complete your quiz - {quiz_title}",
            recipients=emails,
            body=f"""
            <p>Dear User,</p>
            <p>This is a reminder to complete the quiz titled <strong>{quiz_title}</strong>.</p>
            <p>Please complete it as soon as possible.</p>
            <p>Regards,<br>Forsys Quiz Team</p>
            """,
            subtype=MessageType.html,
        )

        await fast_mail.send_message(message)
        return {"message": "Follow-up emails sent to pending users."}

    except Exception as e:
        print("🔥 Error sending follow-up emails:", repr(e))
        raise HTTPException(status_code=500, detail="Failed to send emails.")

@router.get("/export-users")
async def export_users_to_excel(quiz_id: int, session: AsyncSession = Depends(get_db)):
    # Fetch quiz title
    quiz_result = await session.execute(select(Quiz).where(Quiz.id == quiz_id))
    quiz = quiz_result.scalars().first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_title = quiz.title

    # Fetch users assigned to this quiz
    assigned_result = await session.execute(
        select(User)
        .join(models.QuizAccess, models.QuizAccess.user_id == User.id)
        .where(models.QuizAccess.quiz_id == quiz_id)
    )
    assigned_users = assigned_result.scalars().all()

    # Fetch submissions for this quiz
    submissions_result = await session.execute(
        select(Submission).where(Submission.quiz_id == quiz_id)
    )
    submissions = submissions_result.scalars().all()
    submissions_map = {sub.user_id: sub for sub in submissions}

    attempted_data = []
    pending_data = []

    for user in assigned_users:
        sub = submissions_map.get(user.id)
        if sub:
            score = sub.score if sub.score is not None else 0
            time_taken_minutes = round(sub.time_taken / 60, 2) if sub.time_taken else 0
            gpa = round((score / 100) * 5, 2)
            attempted_data.append({
                "Employee ID": user.employee_id,
                "Full Name": user.full_name,
                "Email": user.email,
                "Score": score,
                "Time Taken (in minutes)": time_taken_minutes,
                "GPA (out of 5)": gpa
            })
        else:
            pending_data.append({
                "Employee ID": user.employee_id,
                "Full Name": user.full_name,
                "Email": user.email,
                "Score": "Pending",
                "Time Taken (in minutes)": "Pending",
                "GPA (out of 5)": "Pending"
            })

    # Sort and combine
    attempted_data.sort(key=lambda x: x["Score"] if isinstance(x["Score"], int) else 0, reverse=True)
    data = attempted_data + pending_data
    df = pd.DataFrame(data)

    # Excel output
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Users Report')

        workbook = writer.book
        worksheet = writer.sheets['Users Report']

        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'center',
            'fg_color': '#D9E1F2',
            'border': 1
        })

        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
            worksheet.set_column(col_num, col_num, 25)

    output.seek(0)

    # Generate filename
    safe_title = "".join(c for c in quiz_title if c.isalnum() or c in (' ', '_')).replace(" ", "_")
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"{safe_title}_users_report_{timestamp}.xlsx"
    quoted_filename = urllib.parse.quote(filename)

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            "Content-Disposition": f"attachment; filename={filename}; filename*=UTF-8''{quoted_filename}",
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get("/export-leaderboard")
async def export_leaderboard_to_excel(quiz_id: int, session: AsyncSession = Depends(get_db)):
    # Get quiz title
    quiz_result = await session.execute(select(Quiz.title).where(Quiz.id == quiz_id))
    quiz_row = quiz_result.first()
    if not quiz_row:
        raise HTTPException(status_code=404, detail="Quiz not found")
    quiz_title = quiz_row[0]

    # Get submissions for the quiz
    submissions_result = await session.execute(
        select(Submission, User)
        .join(User, Submission.user_id == User.id)
        .where(Submission.quiz_id == quiz_id)
    )
    rows = submissions_result.all()

    leaderboard_data = []
    for sub, user in rows:
        score = sub.score if sub.score is not None else 0
        time_taken_minutes = round(sub.time_taken / 60, 2) if sub.time_taken else 0
        gpa = round((score / 100) * 5, 2)
        leaderboard_data.append({
            "Employee ID": user.employee_id,
            "Full Name": user.full_name,
            "Email": user.email,
            "Score": score,
            "Time Taken (in minutes)": time_taken_minutes,
            "GPA (out of 5)": gpa,
            "Submitted At": sub.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if sub.submitted_at else "N/A"
        })

    leaderboard_data.sort(key=lambda x: x["Score"], reverse=True)

    df = pd.DataFrame(leaderboard_data)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Leaderboard Report')

        workbook = writer.book
        worksheet = writer.sheets['Leaderboard Report']
        header_format = workbook.add_format({
            'bold': True,
            'text_wrap': True,
            'valign': 'center',
            'fg_color': '#FFE699',
            'border': 1
        })
        for col_num, value in enumerate(df.columns.values):
            worksheet.write(0, col_num, value, header_format)
            worksheet.set_column(col_num, col_num, 25)

    output.seek(0)
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    safe_title = quiz_title.replace(" ", "_")
    filename = f"{safe_title}_leaderboard_report_{timestamp}.xlsx"
    quoted_filename = urllib.parse.quote(filename)

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={
            "Content-Disposition": f"attachment; filename={filename}; filename*=UTF-8''{quoted_filename}"
        }
    )



@router.get("/feedbacks")
async def get_feedbacks(
    quiz_id: int = Query(None),  # Optional query parameter
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    query = (
        select(
            Feedback.id,
            Feedback.feedback_text,
            Quiz.title.label("quiz_title"),
            User.full_name.label("user_name"),
            Feedback.quiz_id,
            Feedback.user_id
        )
        .join(Quiz, Feedback.quiz_id == Quiz.id)
        .join(User, Feedback.user_id == User.id)
        .order_by(Feedback.id.desc())
    )

    # ✅ Filter by quiz_id if provided
    if quiz_id is not None:
        query = query.where(Feedback.quiz_id == quiz_id)

    result = await db.execute(query)
    feedbacks = result.all()

    return [
        {
            "id": f.id,
            "quiz_title": f.quiz_title,
            "user_name": f.user_name,
            "feedback_text": f.feedback_text,
            "quiz_id": f.quiz_id,
            "user_id": f.user_id
        }
        for f in feedbacks
    ]