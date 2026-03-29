# Doküman Analiz — Geliştirme Günlüğü

## 2026-03-29 — Proje Başlangıcı

### Kararlar
- Backend: Python + FastAPI seçildi
- OCR: Chandra OCR 2 GGUF formatı LMStudio'da çalıştırılacak
- Embedding: BGE-M3 (LMStudio'da)
- LLM: LMStudio'daki yüklü model (OpenAI-uyumlu API)
- Vektör DB: ChromaDB (büyük dokümanlar için RAG gerekli)
- Metadata DB: SQLite (az kullanıcı)
- Frontend: React + Tailwind (mobile-first, PWA-ready)
- Tüm ayarlar .env dosyasından okunacak
- Git ile versiyon kontrolü, her aşamada commit

### Yapılanlar
- Git repo başlatıldı
- Proje yapısı oluşturuldu
- Backend iskelet kodu yazıldı:
  - `config.py` — .env'den ayar okuma
  - `database.py` — SQLite bağlantısı
  - `models.py` — Pydantic modelleri
  - `services/ocr.py` — Chandra OCR entegrasyonu (LMStudio vision API)
  - `services/embedding.py` — BGE-M3 embedding + ChromaDB indeksleme
  - `services/llm.py` — RAG tabanlı soru-cevap
  - `routers/documents.py` — Doküman yükleme/listeleme/silme
  - `routers/qa.py` — Soru-cevap endpoint
  - `main.py` — FastAPI uygulama
- Venv oluşturuldu, bağımlılıklar kuruldu
- Dokümantasyon başlatıldı (architecture.md, devlog.md)

### Frontend
- Vite + React + Tailwind CSS ile frontend oluşturuldu
- Mobile-first responsive tasarım
- Bileşenler: FileUpload (drag & drop), DocumentList (durum gösterimi), ChatPanel (soru-cevap)
- Vite proxy ile backend'e bağlanıyor (`/api` → `localhost:8080`)
- Build başarılı test edildi

### Hata Düzeltmeleri
- **OCR text boş geliyordu:** Chandra OCR 2, `content` yerine `reasoning_content` alanına yazıyor. `_extract_text()` fonksiyonu eklendi, her iki alanı da kontrol ediyor.
- **Q&A 400 Bad Request:** LMStudio'daki model ismi `nvidia/nemotron-3-nano` (prefix ile), `.env` güncellendi.
- **Chunk'larda HTML tag'leri:** OCR çıktısı HTML içeriyordu, LLM bunu anlamakta zorlanıyordu. `chunk_text()` fonksiyonuna HTML temizleme eklendi.
- **Backend portu:** 8000 meşguldu, 8080'e taşındı.

### Notlar
- Chandra OCR GGUF: https://huggingface.co/prithivMLmods/chandra-ocr-2-GGUF
- Q8_0 önerilen quant (5.16 GB), mmproj dosyası da gerekli
- Sistem: AMD 7840HS, iGPU, 64GB RAM — 3 model rahat çalışır
- PDF sayfa sayfa işleniyor (PyMuPDF ile görüntüye çevirip OCR'a gönderme)
