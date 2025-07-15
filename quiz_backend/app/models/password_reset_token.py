from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from app.database import Base
import datetime
import uuid
from sqlalchemy.dialects.postgresql import TIMESTAMP as PG_TIMESTAMP 

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    expires_at = Column(PG_TIMESTAMP(timezone=True), nullable=False)

    user = relationship("User", backref="reset_tokens")
