#!/bin/bash
set -e

BACKEND_PORT=${APP_PORT:-8080}

cleanup() {
    echo ""
    echo "Kapatılıyor..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Backend
echo "=== Backend başlatılıyor (port $BACKEND_PORT) ==="
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port $BACKEND_PORT &
BACKEND_PID=$!

# Frontend
echo "=== Frontend başlatılıyor (port 5173) ==="
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Uygulama çalışıyor:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   Ctrl+C ile kapatın"
echo ""

wait
