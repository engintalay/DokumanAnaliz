from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: int
    filename: str
    status: str
    page_count: int
    created_at: str


class QARequest(BaseModel):
    question: str
    document_id: int | None = None


class QAResponse(BaseModel):
    answer: str
    sources: list[dict]
