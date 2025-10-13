#!/bin/bash
# VIIT Smart Attendance System - Health Check

echo "======================================"
echo "🔍 VIIT System Health Check"
echo "======================================"
echo ""

# Check Backend
echo "1️⃣ Backend (FastAPI):"
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "   ✅ Backend is running on http://localhost:8000"
    curl -s http://localhost:8000 | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000
else
    echo "   ❌ Backend is NOT running"
    echo "   👉 Start with: cd Model && source venv/bin/activate && python main.py"
fi
echo ""

# Check Frontend
echo "2️⃣ Frontend (React/Vite):"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "   ✅ Frontend is running on http://localhost:5173"
else
    echo "   ❌ Frontend is NOT running"
    echo "   👉 Start with: npm run dev"
fi
echo ""

# Check Database
echo "3️⃣ Database (SQLite):"
DB_PATH="/home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model/attendance_system.db"
if [ -f "$DB_PATH" ]; then
    echo "   ✅ Database exists"
    echo "   📊 Size: $(du -h "$DB_PATH" | cut -f1)"
else
    echo "   ❌ Database not found"
    echo "   👉 Seed with: cd Model && source venv/bin/activate && python seed_data.py"
fi
echo ""

# Check Python Dependencies
echo "4️⃣ Python Dependencies:"
source /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model/venv/bin/activate 2>/dev/null
if python3 -c "import fastapi, torch, facenet_pytorch, qdrant_client, bcrypt, email_validator" 2>/dev/null; then
    echo "   ✅ All Python dependencies installed"
else
    echo "   ❌ Some dependencies missing"
    echo "   👉 Install with: cd Model && source venv/bin/activate && pip install -r requirements.txt"
fi
deactivate 2>/dev/null
echo ""

# Summary
echo "======================================"
echo "📋 Quick Commands"
echo "======================================"
echo ""
echo "Start Backend:"
echo "  cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Start Frontend:"
echo "  cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN"
echo "  npm run dev"
echo ""
echo "Seed Database:"
echo "  cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model"
echo "  source venv/bin/activate"
echo "  python seed_data.py"
echo ""
echo "======================================"
echo "🔗 Access URLs"
echo "======================================"
echo ""
echo "Frontend:     http://localhost:5173"
echo "Backend:      http://localhost:8000"
echo "API Docs:     http://localhost:8000/docs"
echo ""
echo "Login as Admin:"
echo "  Email:    admin@viit.ac.in"
echo "  Password: viit@admin123"
echo ""

