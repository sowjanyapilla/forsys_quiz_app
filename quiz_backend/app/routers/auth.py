# FastAPI and dependency tools
from fastapi import APIRouter, Depends, HTTPException, status, APIRouter, Depends, HTTPException, Form, Request

# Auth & JWT-related
from fastapi.security import OAuth2PasswordRequestForm
from jose import jwt

# Database & ORM
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# Email sending
from fastapi_mail import MessageSchema

# Utilities & Config
from datetime import timedelta, datetime, timezone
import uuid
from app import models
from app.schemas.user import UserCreate, UserOut
from app.config import SECRET_KEY, ALGORITHM
from app.utils import auth
from app.database import get_db
from app.email import fast_mail
from app.models.user import User
from app.models.password_reset_token import PasswordResetToken
import os


ACCESS_TOKEN_EXPIRE_MINUTES = 30

FRONTEND_URL = os.getenv("FRONTEND_URL")

# Prefix all routes with "/auth" and tag them as "Authentication"
router = APIRouter(prefix="/auth", tags=["Authentication"])


# - Registers a new user if employee ID is not already taken
# - Hashes password
# - Stores user in DB with is_admin=False
@router.post("/signup", response_model=UserOut)
async def signup(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.employee_id == user.employee_id))
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Employee ID already registered")

    hashed_password = auth.hash_password(user.password)
    new_user = models.User(
        employee_id=user.employee_id,
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        is_admin=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


# - Logs user in using email and password (OAuth2PasswordRequestForm)
# - Verifies credentials
# - Generates JWT token (30 min expiry)
# - Returns token and user info
@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(models.User).where(models.User.email == form_data.username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {
        "sub": user.email,
        "is_admin": user.is_admin,
        "employee_id": user.employee_id,
    }
    expire = auth.get_utcnow() + access_token_expires
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "id": user.id,
        "access_token": encoded_jwt,
        "token_type": "bearer",
        "is_admin": user.is_admin,
        "employee_id": user.employee_id,
        "name": user.full_name
    }


# - Sends a password reset link to user's email
# - Generates unique token (UUID)
# - Saves it to DB with 30-min expiration
# - Sends an email with a reset link
@router.post("/forgot-password")
async def forgot_password(request: Request, email: str = Form(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate token
    token = str(uuid.uuid4())
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    reset_token = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
    db.add(reset_token)
    await db.commit()

    # Create reset link
    reset_link = f"{FRONTEND_URL}/reset-password/{token}"

    # Compose email
    message = MessageSchema(
        subject="Reset Your Quiz App Password",
        recipients=[email],
        body=f"Hi {user.full_name},\n\nClick the link below to reset your password:\n\n{reset_link}\n\nThis link expires in 1 hour.",
        subtype="plain"
    )

    await fast_mail.send_message(message)

    return {"message": "Password reset link sent to your email"}


# - Resets password using a valid reset token
# - Verifies token is valid and not expired
# - Updates user password (hashed)
# - Deletes token after use
@router.post("/reset-password")
async def reset_password(token: str = Form(...), new_password: str = Form(...), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PasswordResetToken).where(PasswordResetToken.token == token))
    token_obj = result.scalar_one_or_none()

    if not token_obj:
        raise HTTPException(status_code=404, detail="Invalid token")

    if token_obj.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")

    result = await db.execute(select(User).where(User.id == token_obj.user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash new password and update
    from app.utils.auth import hash_password
    user.password_hash = hash_password(new_password)
    await db.commit()

    # Optionally delete token
    await db.delete(token_obj)
    await db.commit()

    return {"message": "Password reset successful"}
