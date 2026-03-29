import httpx
from backend.config import settings
from backend.services.embedding import search


async def ask(question: str, document_id: int | None = None) -> dict:
    """RAG ile soru-cevap yapar."""
    sources = await search(question, document_id)

    if not sources:
        return {"answer": "Bu konuda bilgi bulunamadı.", "sources": []}

    context = "\n\n---\n\n".join(
        f"[Kaynak {i+1}]: {s['text']}" for i, s in enumerate(sources)
    )

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{settings.lmstudio_base_url}/chat/completions",
            headers={"Authorization": f"Bearer {settings.lmstudio_api_key}"},
            json={
                "model": settings.qa_model_name,
                "messages": [
                    {"role": "system", "content": (
                        "Sen bir doküman analiz asistanısın. Verilen kaynaklara dayanarak soruları cevapla. "
                        "Her cevabında hangi kaynaktan bilgi aldığını [Kaynak N] şeklinde belirt. "
                        "Kaynaklarda bilgi yoksa bilmediğini söyle."
                    )},
                    {"role": "user", "content": f"Kaynaklar:\n{context}\n\nSoru: {question}"}
                ]
            }
        )
        resp.raise_for_status()
        answer = resp.json()["choices"][0]["message"]["content"]

    return {
        "answer": answer,
        "sources": [{"text": s["text"][:200], "metadata": s["metadata"]} for s in sources]
    }
