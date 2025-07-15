from sqlalchemy import Column, String, Boolean, DateTime, JSON, Integer, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from ..database import Base
from .question import Question  # Import the Question class
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSONB

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # This is the primary key
    source_quiz_id = Column(Integer, ForeignKey("quiz.id"))  # new: reference original quiz
    time_limit = Column(Integer, nullable=True)              # per question
    #description = Column(String)                            # admin-defined description
    is_active = Column(Boolean, default=True)                # default to active
    active_till = Column(DateTime, nullable=True)            # new
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    questions_json = Column(JSONB, nullable=False, default=[])
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    manual_override_quiz_active = Column(Boolean, default=False)

