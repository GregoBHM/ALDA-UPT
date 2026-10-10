from pydantic import BaseModel
from typing import List, Optional


class CompileRequest(BaseModel):
    code: str
    language: str = "cpp"
    laboratory_id: Optional[str] = None


class ChatMessage(BaseModel):
    role: str
    text: str


class AssistantRequest(BaseModel):
    messages: List[ChatMessage]
    code: Optional[str] = None
    language: Optional[str] = None
    laboratory_id: Optional[str] = None
    terminal_output: Optional[str] = None
    is_pasted: Optional[bool] = False


class RunTestsRequest(BaseModel):
    code: str
    language: str = "cpp"
    laboratory_id: str


class AttemptRatingRequest(BaseModel):
    rating: int
    comment: Optional[str] = None
