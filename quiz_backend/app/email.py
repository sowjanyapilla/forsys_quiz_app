import os
from dotenv import load_dotenv
from pathlib import Path
from fastapi_mail import FastMail, ConnectionConfig

load_dotenv(load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env"))

print("📧 Email config:", {
    "MAIL_USERNAME": os.getenv("MAIL_USERNAME"),
    "MAIL_PASSWORD": os.getenv("MAIL_PASSWORD"),
    "MAIL_FROM": os.getenv("MAIL_FROM"),
    "MAIL_PORT": os.getenv("MAIL_PORT"),
    "MAIL_STARTTLS": os.getenv("MAIL_STARTTLS"),
    "MAIL_SSL_TLS": os.getenv("MAIL_SSL_TLS")
})


conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME"),
    MAIL_PORT=int(os.getenv("MAIL_PORT")),
    MAIL_SERVER=os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() in ("true", "1", "yes"),
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() in ("true", "1", "yes"),

    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

fast_mail = FastMail(conf)
