# from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey
# from sqlalchemy.orm import relationship
# from ..database import Base

# class QuizAttempt(Base):
#     __tablename__ = "quiz_attempts"

#     id = Column(Integer, primary_key=True, index=True)
#     user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
#     quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)  # Correct reference to 'quizzes.id'
#     started_at = Column(TIMESTAMP, nullable=False)

#     # Relationships to user and quiz
#     user = relationship("User", back_populates="quiz_attempts")
#     quiz = relationship("Quiz", back_populates="quiz_attempts") 
#     submissions = relationship("Submission", back_populates="quiz_attempt") # Reference the correct relationship in 'Quiz'
