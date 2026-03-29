import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from backend.config import settings
from backend.database import get_db
from backend.models import DocumentResponse
from backend.services.ocr import ocr_image, ocr_pdf
from backend.services.embedding import index_document

router = APIRouter(prefix="/api/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".webp", ".tiff", ".tif", ".bmp"}


async def process_document(doc_id: int, file_path: str):
    """Arka planda dokümanı OCR'dan geçirip indeksler."""
    try:
        ext = Path(file_path).suffix.lower()
        if ext == ".pdf":
            pages = await ocr_pdf(file_path)
            full_text = "\n\n---\n\n".join(pages)
            page_count = len(pages)
        else:
            full_text = await ocr_image(file_path)
            page_count = 1

        await index_document(doc_id, full_text)

        with get_db() as db:
            db.execute(
                "UPDATE documents SET ocr_text=?, page_count=?, status='completed' WHERE id=?",
                (full_text, page_count, doc_id)
            )
    except Exception as e:
        import traceback
        traceback.print_exc()
        with get_db() as db:
            db.execute(
                "UPDATE documents SET status='error' WHERE id=?", (doc_id,)
            )


@router.post("/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile, background_tasks: BackgroundTasks):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Desteklenmeyen dosya türü: {ext}")

    save_path = Path(settings.upload_dir) / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    with get_db() as db:
        cursor = db.execute(
            "INSERT INTO documents (filename, original_path, status) VALUES (?, ?, 'processing')",
            (file.filename, str(save_path))
        )
        doc_id = cursor.lastrowid
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()

    background_tasks.add_task(process_document, doc_id, str(save_path))

    return DocumentResponse(
        id=row["id"], filename=row["filename"], status=row["status"],
        page_count=row["page_count"], created_at=str(row["created_at"])
    )


@router.get("/", response_model=list[DocumentResponse])
async def list_documents():
    with get_db() as db:
        rows = db.execute("SELECT * FROM documents ORDER BY created_at DESC").fetchall()
    return [
        DocumentResponse(
            id=r["id"], filename=r["filename"], status=r["status"],
            page_count=r["page_count"], created_at=str(r["created_at"])
        ) for r in rows
    ]


@router.get("/{doc_id}")
async def get_document(doc_id: int):
    with get_db() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Doküman bulunamadı")
    return dict(row)


@router.delete("/{doc_id}")
async def delete_document(doc_id: int):
    with get_db() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Doküman bulunamadı")
        Path(row["original_path"]).unlink(missing_ok=True)
        db.execute("DELETE FROM documents WHERE id=?", (doc_id,))
    return {"message": "Silindi"}


@router.get("/{doc_id}/file")
async def get_document_file(doc_id: int):
    """Dokümanın orijinal dosyasını döndürür."""
    with get_db() as db:
        row = db.execute("SELECT * FROM documents WHERE id=?", (doc_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Doküman bulunamadı")
    path = Path(row["original_path"])
    if not path.exists():
        raise HTTPException(404, "Dosya bulunamadı")
    return FileResponse(path, filename=row["filename"])
