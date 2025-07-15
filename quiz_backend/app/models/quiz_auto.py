from sqlalchemy import Column, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from ..database import Base

class AutoQuiz(Base):
    __tablename__ = "quiz" 

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    questions = Column(JSONB, nullable=False)
