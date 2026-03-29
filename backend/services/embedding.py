import chromadb
import httpx
from backend.config import settings

_client = chromadb.PersistentClient(path=settings.chroma_db_path)
_collection = _client.get_or_create_collection("documents")


async def get_embedding(text: str) -> list[float]:
    """LMStudio'daki BGE-M3 ile embedding üretir."""
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{settings.lmstudio_base_url}/embeddings",
            headers={"Authorization": f"Bearer {settings.lmstudio_api_key}"},
            json={"model": settings.embedding_model_name, "input": text}
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]


def chunk_text(text: str, doc_id: int) -> list[dict]:
    """Metni chunk'lara böler. HTML tag'lerini temizler."""
    import re
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()

    chunks = []
    start = 0
    idx = 0
    while start < len(clean):
        end = start + settings.chunk_size
        chunk = clean[start:end]
        if chunk.strip():
            chunks.append({
                "id": f"doc{doc_id}_chunk{idx}",
                "text": chunk,
                "metadata": {"document_id": doc_id, "chunk_index": idx}
            })
            idx += 1
        start += settings.chunk_size - settings.chunk_overlap
    return chunks


async def index_document(doc_id: int, text: str):
    """Doküman metnini chunk'layıp ChromaDB'ye kaydeder."""
    chunks = chunk_text(text, doc_id)
    for chunk in chunks:
        embedding = await get_embedding(chunk["text"])
        _collection.upsert(
            ids=[chunk["id"]],
            embeddings=[embedding],
            documents=[chunk["text"]],
            metadatas=[chunk["metadata"]]
        )


async def search(query: str, document_id: int | None = None, top_k: int = 5) -> list[dict]:
    """Sorguya en yakın chunk'ları döndürür."""
    query_embedding = await get_embedding(query)
    where = {"document_id": document_id} if document_id else None
    results = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where=where
    )
    return [
        {"text": doc, "metadata": meta}
        for doc, meta in zip(results["documents"][0], results["metadatas"][0])
    ]
