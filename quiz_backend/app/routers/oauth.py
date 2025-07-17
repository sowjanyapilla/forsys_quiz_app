# Import necessary FastAPI and Starlette components
from fastapi import APIRouter, Request, Depends, HTTPException
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timedelta, timezone
import os
import jwt
from fastapi.responses import RedirectResponse
from fastapi import Response
from urllib.parse import urlencode

# Import application-specific modules
from app.database import get_db
from app import models
from app.utils import auth
from app.config import ACCESS_TOKEN_EXPIRE_MINUTES, SECRET_KEY, ALGORITHM


# Create API router instance
router = APIRouter()

# Load Google OAuth client credentials from environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL")
VITE_API_BASE_URL = os.getenv("VITE_API_BASE_URL")

# Configure OAuth with client credentials
config = Config(environ={
    "GOOGLE_CLIENT_ID": GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": GOOGLE_CLIENT_SECRET
})

# Initialize OAuth object and register Google as the provider
oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Endpoint to initiate Google OAuth login
@router.get("/auth/login")
async def login(request: Request):
    # Define the redirect URI after Google authentication
    redirect_uri = f"{VITE_API_BASE_URL}/auth/google/callback"
    print(">>> [LOGIN] Before redirect. Session state:", request.session.get("state"))
     # Redirect user to Google login page
    return await oauth.google.authorize_redirect(request, redirect_uri)


# OAuth callback endpoint after Google authentication
@router.get("/auth/google/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    print(">>> [CALLBACK] Session state:", request.session.get("state"))
    print(">>> [CALLBACK] URL param state:", request.query_params.get("state"))

    # Fetch token and user info from Google
    token = await oauth.google.authorize_access_token(request)
    user_info = await oauth.google.userinfo(token=token)

    # Extract email from user info
    email = user_info.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email found in token")

    # Check if user exists in the database
    result = await db.execute(select(models.User).where(models.User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=403, detail="Unauthorized")

    # Generate JWT token for the authenticated user
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {
        "sub": user.email,
        "is_admin": user.is_admin,
        "employee_id": user.employee_id,
        "exp": expire,
    }
    jwt_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)

     # Encode user data in query parameters for redirect
    query = urlencode({
        "token": jwt_token,
        "email": user.email,
        "name": user.full_name,
        "is_admin": str(user.is_admin).lower(),
        "employee_id": user.employee_id,
        "id": user.id
    })

     # Redirect to frontend with token and user data in query params
    redirect_url = f"{FRONTEND_URL}/oauth-callback?{query}"
    return RedirectResponse(url=redirect_url)