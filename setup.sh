#!/bin/bash
set -e

echo "=== Doküman Analiz - Kurulum ==="

# Backend
echo "[1/4] Python venv oluşturuluyor..."
python3 -m venv venv
source venv/bin/activate

echo "[2/4] Python bağımlılıkları kuruluyor..."
pip install -r backend/requirements.txt -q

# Frontend
echo "[3/4] Frontend bağımlılıkları kuruluyor..."
cd frontend
npm install --silent
cd ..

# .env
echo "[4/4] Ayar dosyası kontrol ediliyor..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  .env dosyası oluşturuldu. Gerekirse düzenleyin."
else
    echo "  .env zaten mevcut."
fi

# Dizinler
mkdir -p uploads outputs

echo ""
echo "✅ Kurulum tamamlandı!"
echo "Çalıştırmak için: ./run.sh"
