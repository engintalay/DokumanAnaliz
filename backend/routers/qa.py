from fastapi import APIRouter
from backend.models import QARequest, QAResponse
from backend.services.llm import ask

router = APIRouter(prefix="/api/qa", tags=["qa"])


@router.post("/", response_model=QAResponse)
async def question_answer(req: QARequest):
    result = await ask(req.question, req.document_id)
    return QAResponse(**result)
