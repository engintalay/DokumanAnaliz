from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.services.embedding import chunk_text, search, _collection

router = APIRouter(prefix="/api/debug", tags=["debug"])


@router.get("/chunks/{doc_id}")
async def get_chunks(doc_id: int):
    """Dokümanın chunk'larını gösterir."""
    with get_db() as db:
        row = db.execute("SELECT ocr_text FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Doküman bulunamadı")
    chunks = chunk_text(row["ocr_text"], doc_id)
    return {"total": len(chunks), "chunks": [{"index": c["metadata"]["chunk_index"], "length": len(c["text"]), "text": c["text"]} for c in chunks]}


@router.get("/ocr/{doc_id}")
async def get_ocr_text(doc_id: int):
    """Dokümanın ham OCR metnini gösterir."""
    with get_db() as db:
        row = db.execute("SELECT ocr_text FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Doküman bulunamadı")
    return {"text": row["ocr_text"]}


@router.get("/search")
async def debug_search(q: str, doc_id: int | None = None, top_k: int = 5):
    """Sorgu ile RAG araması yapar, sonuçları gösterir."""
    results = await search(q, doc_id, top_k)
    return {"query": q, "results": results}


@router.get("/chroma-stats")
async def chroma_stats():
    """ChromaDB istatistikleri."""
    count = _collection.count()
    return {"total_chunks_indexed": count}
