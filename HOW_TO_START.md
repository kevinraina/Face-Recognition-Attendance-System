# 🚀 How to Start the Face Recognition Attendance System

## Prerequisites
- ✅ Docker Desktop installed and running
- ✅ Python installed (with virtual environment in Model folder)
- ✅ Node.js and npm installed

---

## Step-by-Step Startup Guide

### Step 1: Start Qdrant Database (Vector DB)

**IMPORTANT:** You must use the command below to ensure data persists after restart!

1. **Open PowerShell or Command Prompt**

2. **Run this command:**
   ```bash
   docker run -d -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
   ```
   
   **What this does:**
   - `-d`: Run in background
   - `-p 6333:6333`: Expose port 6333
   - `-v qdrant_storage:/qdrant/storage`: **PERSIST DATA** (this is the important part!)
   
3. **Wait 10-15 seconds** for Qdrant to fully start

✅ **Verify:** Open browser and go to `http://localhost:6333/dashboard`
   - If you see Qdrant dashboard, it's working!

**Note:** If you get "port already allocated" error, it means Qdrant is already running. Check Docker Desktop or run:
```bash
docker ps
```
---

### Step 2: Start Backend Server (Python/FastAPI)

1. **Open PowerShell or Command Prompt**

2. **Navigate to Model folder:**
   ```bash
   cd "C:\Users\kevin\OneDrive\Desktop\Face-Recognition-Attendance-System\Model"
   ```

3. **Activate virtual environment:**
   ```bash
   venv\Scripts\activate
   ```
   - You should see `(venv)` in your prompt

4. **Start the backend server:**
   ```bash
   python main.py
   ```

✅ **Expected Output:**
```
ℹ️  Collection 'Student_Faces' already exists.
INFO:     Started server process [xxxxx]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Verify:** Open browser and go to `http://localhost:8000/docs`
   - If you see API documentation, backend is running!

**Keep this terminal window open!**

---

### Step 3: Start Frontend (React)

1. **Open a NEW PowerShell/Command Prompt** (don't close the backend terminal!)

2. **Navigate to project root:**
   ```bash
   cd "C:\Users\kevin\OneDrive\Desktop\Face-Recognition-Attendance-System"
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

✅ **Expected Output:**
```
VITE vX.X.X  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Keep this terminal window open too!**

---

### Step 4: Access the Application

Open your browser and go to: **http://localhost:5173**

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@viit.ac.in` | `viit@admin123` |
| **Teacher** | `rajesh@viit.ac.in` | `teacher123` |
| **Student** | `aarav@viit.ac.in` | `student123` |

---

## 🛑 How to Stop Everything

1. **Stop Frontend:** Press `Ctrl+C` in the frontend terminal
2. **Stop Backend:** Press `Ctrl+C` in the backend terminal
3. **Stop Qdrant:** In Docker Desktop, click the ⏹️ Stop button on the Qdrant container

---

## ⚠️ Common Issues

### Issue: "Qdrant connection error"
**Solution:** Make sure Docker Desktop is running and Qdrant container is started

### Issue: "Port 8000 already in use"
**Solution:** Another program is using port 8000. Close it or restart your computer

### Issue: "npm command not found"
**Solution:** Install Node.js from https://nodejs.org

### Issue: "python not found"
**Solution:** Install Python from https://python.org and make sure to check "Add to PATH"

### Issue: "Module not found" errors in backend
**Solution:** 
```bash
cd Model
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: Frontend shows blank page
**Solution:** 
1. Check browser console (F12) for errors
2. Make sure backend is running on port 8000
3. Clear browser cache and refresh

---

## 📝 Quick Reference

| Component | URL | Status Check |
|-----------|-----|--------------|
| Frontend | http://localhost:5173 | Open in browser |
| Backend API | http://localhost:8000 | Open /docs endpoint |
| API Docs | http://localhost:8000/docs | Should show Swagger UI |
| Qdrant Dashboard | http://localhost:6333/dashboard | Should show Qdrant UI |

---

## 🎯 What Each Component Does

- **Qdrant:** Stores face embeddings (512-dimensional vectors) for face recognition
- **Backend (FastAPI):** Handles face detection, matching, attendance processing, and database
- **Frontend (React):** User interface for teachers, students, and admins
- **SQLite Database:** Stores user data, attendance records, subjects, schedules

---

## 💡 Pro Tips

1. **Always start in this order:** Qdrant → Backend → Frontend
2. **Check all 3 URLs** to verify everything is running
3. **Keep both terminal windows open** while using the system
4. **If something breaks:** Restart in order: Frontend → Backend → Qdrant → Start everything again
5. **Before presenting to teacher:** Test with sample photos first!

---

## 📞 Emergency Restart

If everything is messed up:

1. Close all terminals
2. Stop Qdrant in Docker Desktop
3. Restart computer
4. Follow steps 1-4 again

---

**Last Updated:** November 3, 2025
**Project:** Face Recognition Attendance System
**Made by:** Kevin

