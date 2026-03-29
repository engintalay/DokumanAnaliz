import base64
import httpx
from pathlib import Path
from backend.config import settings


async def ocr_image(image_path: str) -> str:
    """Tek bir görüntüyü LMStudio'daki Chandra OCR ile işler."""
    image_bytes = Path(image_path).read_bytes()
    b64 = base64.b64encode(image_bytes).decode()
    ext = Path(image_path).suffix.lstrip(".").lower()
    mime = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "webp": "image/webp", "gif": "image/gif", "tiff": "image/tiff",
            "tif": "image/tiff", "bmp": "image/bmp"}.get(ext, "image/png")

    async with httpx.AsyncClient(timeout=300) as client:
        resp = await client.post(
            f"{settings.lmstudio_base_url}/chat/completions",
            headers={"Authorization": f"Bearer {settings.lmstudio_api_key}"},
            json={
                "model": settings.ocr_model_name,
                "max_tokens": settings.ocr_max_tokens,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Convert this document to markdown. Preserve all layout, tables, and formatting."},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}}
                    ]
                }]
            }
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def ocr_pdf(pdf_path: str) -> list[str]:
    """PDF'i sayfa sayfa görüntüye çevirip OCR yapar."""
    import fitz  # PyMuPDF

    doc = fitz.open(pdf_path)
    results = []
    for page in doc:
        pix = page.get_pixmap(dpi=200)
        img_path = Path(settings.output_dir) / f"_temp_page_{page.number}.png"
        pix.save(str(img_path))
        text = await ocr_image(str(img_path))
        results.append(text)
        img_path.unlink(missing_ok=True)
    doc.close()
    return results
