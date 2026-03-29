from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    # LMStudio
    lmstudio_base_url: str = "http://localhost:1234/v1"
    lmstudio_api_key: str = "lm-studio"

    # Model names
    ocr_model_name: str = "chandra-ocr-2"
    embedding_model_name: str = "text-embedding-bge-m3"
    qa_model_name: str = "nemotron-3-nano"

    # OCR
    ocr_max_tokens: int = 12384

    # App
    app_host: str = "0.0.0.0"
    app_port: int = 8080
    upload_dir: str = "uploads"
    output_dir: str = "outputs"

    # Database
    sqlite_db_path: str = "dokuman_analiz.db"
    chroma_db_path: str = "chroma_data"

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()

# Dizinleri oluştur
Path(settings.upload_dir).mkdir(exist_ok=True)
Path(settings.output_dir).mkdir(exist_ok=True)
