from sqlalchemy import Column, Integer, ForeignKey
from ..database import Base

class QuizGroup(Base):
    __tablename__ = "quiz_groups"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"))
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"))
