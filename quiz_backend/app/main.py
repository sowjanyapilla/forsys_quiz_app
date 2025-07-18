from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi import status
from fastapi.exceptions import RequestValidationError
from fastapi.exception_handlers import http_exception_handler
from app.models.user import User
from app.models.quiz import Quiz
from app.routers import leaderboard, oauth
from app.routers import quiz_attempt
from app.email import fast_mail  # correct name
from starlette.middleware.sessions import SessionMiddleware

from dotenv import load_dotenv 


from .routers import (
    auth,
    user,
    admin,
    leaderboard,
    quiz,
    question,
    submission,
    oauth
)

import logging
import os

logger = logging.getLogger("uvicorn")
logger.setLevel(logging.DEBUG)

load_dotenv()
app = FastAPI(
    title="Quiz Application Backend",
    description="FastAPI backend for role-based quiz application",
    version="1.0.0"
)

# Session Middleware (required for request.session)
SESSION_SECRET = os.getenv("SESSION_SECRET_KEY")
if not SESSION_SECRET:
    raise RuntimeError("SESSION_SECRET_KEY is not set in your environment")


print(f"[DEBUG] SESSION_SECRET = {SESSION_SECRET}")


app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",       #  Required for CSRF protection
    https_only=False,      # Keep False for local development
    session_cookie="session"
)


# CORS setup
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:8080"
      # react dev server
    # add production domain here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
       "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# include routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(admin.router)
app.include_router(leaderboard.router)
app.include_router(quiz.router)
app.include_router(question.router)
app.include_router(submission.router)
app.include_router(leaderboard.router)
app.include_router(oauth.router)

@app.get("/")
async def root():
    return {"message": "Quiz App Backend is running 🚀"}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 Unhandled Exception: {repr(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": str(exc)},
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"🔥 Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )
