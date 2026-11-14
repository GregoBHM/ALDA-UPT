from pydantic import BaseModel, Field, field_validator
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
    title: str = Field(..., min_length=1)
    content: str = Field(..., min_length=10)

    @field_validator('title')
    def title_must_not_be_blank(cls, v):
        if not v.strip():
            raise ValueError('El título no puede estar vacío')
        return v
    
    @field_validator('content')
    def content_min_length(cls, v):
        if len(v.strip()) < 10:
            raise ValueError('El contenido debe tener al menos 10 caracteres')
        return v


class KnowledgeItemRequest(BaseModel):
    title: str
    content: str
