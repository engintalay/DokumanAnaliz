import httpx
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.config import settings
from backend.models import QARequest
from backend.services.embedding import search

router = APIRouter(prefix="/api/qa", tags=["qa"])


async def stream_answer(question: str, document_id: int | None = None):
    """RAG ile soru-cevap yapar, SSE stream olarak döner."""
    try:
        sources = await search(question, document_id)
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        yield "data: [DONE]\n\n"
        return

    if not sources:
        yield f"data: {json.dumps({'type': 'content', 'content': 'Bu konuda bilgi bulunamadı.'})}\n\n"
        yield f"data: {json.dumps({'type': 'sources', 'sources': []})}\n\n"
        yield "data: [DONE]\n\n"
        return

    # Kaynakları hemen gönder
    sources_data = [{"text": s["text"][:200], "metadata": s["metadata"]} for s in sources]
    yield f"data: {json.dumps({'type': 'sources', 'sources': sources_data})}\n\n"

    context = "\n\n---\n\n".join(
        f"[Kaynak {i+1}]: {s['text']}" for i, s in enumerate(sources)
    )

    try:
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{settings.lmstudio_base_url}/chat/completions",
                headers={"Authorization": f"Bearer {settings.lmstudio_api_key}"},
                json={
                    "model": settings.qa_model_name,
                    "stream": True,
                    "messages": [
                        {"role": "system", "content": (
                            "Sen bir doküman analiz asistanısın. Verilen kaynaklara dayanarak soruları cevapla. "
                            "Her cevabında hangi kaynaktan bilgi aldığını [Kaynak N] şeklinde belirt. "
                            "Kaynaklarda bilgi yoksa bilmediğini söyle."
                        )},
                        {"role": "user", "content": f"Kaynaklar:\n{context}\n\nSoru: {question}"}
                    ]
                }
            ) as resp:
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:]
                    if payload == "[DONE]":
                        break
                    try:
                        chunk = json.loads(payload)
                        delta = chunk["choices"][0].get("delta", {})
                        # Thinking/reasoning content
                        if delta.get("reasoning_content"):
                            yield f"data: {json.dumps({'type': 'thinking', 'content': delta['reasoning_content']})}\n\n"
                        # Normal content
                        if delta.get("content"):
                            yield f"data: {json.dumps({'type': 'content', 'content': delta['content']})}\n\n"
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

    yield "data: [DONE]\n\n"


@router.post("/stream")
async def question_answer_stream(req: QARequest):
    return StreamingResponse(
        stream_answer(req.question, req.document_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.post("/")
async def question_answer(req: QARequest):
    """Non-streaming fallback."""
    from backend.services.llm import ask
    try:
        result = await ask(req.question, req.document_id)
    except Exception as e:
        result = {"answer": f"Hata: {type(e).__name__}: {e}", "sources": []}
    from backend.models import QAResponse
    return QAResponse(**result)
