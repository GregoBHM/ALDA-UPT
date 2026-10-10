from pydantic import BaseModel
from typing import List, Optional


class TestCaseCreateRequest(BaseModel):
    input_data: str
    expected_output: str
    is_hidden: bool = False
    evaluation_type: str = "exact"  # exact | regex | ai_semantic


class LabCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "medium"
    is_exam: bool = False
    test_cases: List[TestCaseCreateRequest] = []


class LabUpdateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "medium"
    is_exam: bool = False
    test_cases: List[TestCaseCreateRequest] = []


class AnnouncementRequest(BaseModel):
    title: str
    content: str


class KnowledgeItemRequest(BaseModel):
    title: str
    content: str
