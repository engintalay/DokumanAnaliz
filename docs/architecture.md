# Doküman Analiz — Mimari Kararlar

## Teknoloji Seçimleri

| Bileşen | Seçim | Sebep |
|---|---|---|
| Backend | Python + FastAPI | Async desteği, hızlı geliştirme |
| OCR | Chandra OCR 2 (GGUF) | SOTA doğruluk, LMStudio'da çalışır |
| Embedding | BGE-M3 | Çok dilli, 8192 token, LMStudio'da çalışır |
| Vektör DB | ChromaDB | Python-native, dosya tabanlı, kurulumu kolay |
| Metadata DB | SQLite | Az kullanıcı için yeterli, ekstra servis gerektirmez |
| LLM | LMStudio (OpenAI-uyumlu API) | Lokal, ücretsiz, model değiştirilebilir |
| Frontend | React + Tailwind | Mobile-first, PWA/React Native'e dönüştürülebilir |

## Akış

```
Doküman Yükleme:
  Upload → FastAPI → Dosya kaydedilir → Arka plan görevi başlar
  → PDF ise sayfa sayfa görüntüye çevrilir (PyMuPDF)
  → Her sayfa LMStudio'daki Chandra OCR'a gönderilir (base64 image)
  → OCR sonucu markdown olarak döner
  → Metin chunk'lara bölünür → BGE-M3 ile embedding → ChromaDB'ye kaydedilir
  → Metadata SQLite'a kaydedilir

Soru-Cevap (RAG):
  Soru → BGE-M3 ile embedding → ChromaDB'den en yakın chunk'lar
  → Chunk'lar + soru → LMStudio'daki LLM → Cevap (kaynak göstererek)
```

## LMStudio Modelleri

LMStudio'da 3 model yüklü olmalı:
1. **chandra-ocr-2** — OCR için (vision model, GGUF)
2. **bge-m3** — Embedding için
3. **Q&A modeli** — Soru-cevap için (kullanıcının tercihi)

Tümü `http://localhost:1234/v1` üzerinden OpenAI-uyumlu API ile erişilir.

## Konfigürasyon

Tüm ayarlar `.env` dosyasından okunur. Hardcoded parametre yok.
`backend/config.py` → pydantic-settings ile `.env` parse edilir.
