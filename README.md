# Doküman Analiz

Dokümanları OCR ile tarayıp, metin çıkarıp, soru-cevap yapabilen web uygulaması.

## Gereksinimler

- Python 3.12+
- Node.js 20+
- LMStudio (aşağıdaki modeller yüklü olmalı):
  - **chandra-ocr-2** (GGUF) — OCR
  - **bge-m3** — Embedding
  - Bir Q&A modeli (tercihe bağlı)

## Kurulum

```bash
# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend
npm install
cd ..

# Ayarları düzenle
cp .env.example .env
# .env dosyasını düzenle
```

## Çalıştırma

```bash
# LMStudio'yu başlat (3 model yüklü olmalı)

# Backend
source venv/bin/activate
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (ayrı terminal)
cd frontend
npm run dev
```

Tarayıcıda `http://localhost:5173` adresine git.

## Kullanım

1. Sol panelden doküman yükle (PDF, PNG, JPG vs.)
2. OCR işlemi tamamlanınca dokümanı seç
3. Sağ panelden soru sor
