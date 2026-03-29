import chromadb
import httpx
from backend.config import settings

_client = chromadb.PersistentClient(path=settings.chroma_db_path)
_collection = _client.get_or_create_collection("documents")


async def get_embedding(text: str) -> list[float]:
    """LMStudio'daki BGE-M3 ile embedding üretir."""
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{settings.lmstudio_base_url}/embeddings",
            headers={"Authorization": f"Bearer {settings.lmstudio_api_key}"},
            json={"model": settings.embedding_model_name, "input": text}
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]


def chunk_text(text: str, doc_id: int) -> list[dict]:
    """Metni chunk'lara böler. HTML tag'lerini temizler. Soru numaralarından bölmeyi dener."""
    import re
    clean = re.sub(r'<[^>]+>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean).strip()

    # Soru numaralarından bölmeyi dene (ör: "7. Bir", "8. Bir")
    parts = re.split(r'(?=\b\d{1,3}\.\s+[A-ZÇĞİÖŞÜa-zçğıöşü])', clean)
    parts = [p.strip() for p in parts if p.strip()]

    # Eğer parçalar çok büyükse, karakter bazlı böl
    chunks = []
    idx = 0
    for part in parts:
        if len(part) <= settings.chunk_size * 2:
            chunks.append({"id": f"doc{doc_id}_chunk{idx}", "text": part,
                           "metadata": {"document_id": doc_id, "chunk_index": idx}})
            idx += 1
        else:
            start = 0
            while start < len(part):
                end = start + settings.chunk_size
                piece = part[start:end]
                if piece.strip():
                    chunks.append({"id": f"doc{doc_id}_chunk{idx}", "text": piece,
                                   "metadata": {"document_id": doc_id, "chunk_index": idx}})
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
