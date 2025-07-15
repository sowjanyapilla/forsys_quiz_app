

from sqlalchemy import Column, Integer, ForeignKey
from ..database import Base

class QuizAccess(Base):
    __tablename__ = "quiz_access"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"))
    quiz_id = Column(Integer, ForeignKey("quiz.id", ondelete="CASCADE"))
