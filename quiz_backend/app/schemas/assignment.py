from pydantic import BaseModel
from typing import List

class UserAssignment(BaseModel):
    user_ids: List[str]
