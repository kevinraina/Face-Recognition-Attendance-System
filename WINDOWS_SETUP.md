# 🪟 VIIT Attendance System - Windows Setup Guide

**For cloning from GitHub and running on Windows laptop**

---

## 📋 **Prerequisites**

Install these BEFORE cloning:

### 1️⃣ **Git for Windows**
- Download: https://git-scm.com/download/win
- Install with default settings
- Open **Git Bash** (not CMD/PowerShell)

### 2️⃣ **Python 3.10+**
- Download: https://www.python.org/downloads/
- ✅ **CHECK "Add Python to PATH"** during installation!
- Verify: Open CMD → `python --version`

### 3️⃣ **Node.js 18+**
- Download: https://nodejs.org/
- Install LTS version
- Verify: Open CMD → `node --version` and `npm --version`

### 4️⃣ **Docker Desktop** (for Qdrant)
- Download: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop
- Wait for Docker to be running (system tray icon)

---

## 🚀 **STEP-BY-STEP SETUP**

### **STEP 1: Clone the Repository**

Open **Git Bash** or **CMD**:

```bash
cd C:\Users\YourUsername\Desktop
git clone https://github.com/kevinraina/Face-Recognition-Attendance-System.git
cd Face-Recognition-Attendance-System
```

---

### **STEP 2: Backend Setup (Python)**

Open **CMD** or **PowerShell** in the project folder:

```bash
cd Model
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Create Admin User:**
```bash
python init_admin.py
```

**Seed Database with VIIT Data:**
```bash
python seed_data.py
```

---

### **STEP 3: Frontend Setup (React)**

Open a **NEW CMD/PowerShell** window in the project root:

```bash
npm install
```

---

### **STEP 4: Start Qdrant (Vector Database)**

Open **Docker Desktop** (make sure it's running).

Then in **CMD/PowerShell**:

```bash
docker run -p 6333:6333 qdrant/qdrant
```

**Keep this terminal open!**

---

## 🎯 **RUNNING THE SYSTEM**

You need **3 terminals open**:

### **Terminal 1: Qdrant (Docker)**
```bash
docker run -p 6333:6333 qdrant/qdrant
```

### **Terminal 2: Backend (FastAPI)**
```bash
cd Model
venv\Scripts\activate
python main.py
```

Backend will run on: **http://localhost:8000**

### **Terminal 3: Frontend (React)**
```bash
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## 🔐 **VIIT Login Credentials**

### **Admin**
- Email: `admin@viit.ac.in`
- Password: `viit@admin123`

### **Teacher**
- Email: `rajesh@viit.ac.in`
- Password: `teacher123`

### **Student**
- Email: `aarav@viit.ac.in` (or any seeded student)
- Password: `student123`

---

## 🛠️ **Troubleshooting**

### **Problem: "python is not recognized"**
**Solution:** Reinstall Python and CHECK "Add to PATH" during installation.

### **Problem: "docker: command not found"**
**Solution:** Make sure Docker Desktop is running (check system tray).

### **Problem: "Qdrant connection refused"**
**Solution:** Start Qdrant first (Terminal 1) before starting backend.

### **Problem: Backend won't start**
**Solution:**
1. Make sure virtual environment is activated (`venv\Scripts\activate`)
2. Run `pip install -r requirements.txt` again
3. Delete `attendance_system.db` and re-run `init_admin.py`

### **Problem: Frontend shows "API connection error"**
**Solution:** Make sure backend is running on port 8000.

---

## 📂 **Project Structure**

```
Face-Recognition-Attendance-System/
├── Model/                  # Backend (Python/FastAPI)
│   ├── main.py            # Main API server
│   ├── auth.py            # Authentication
│   ├── database.py        # Database models
│   ├── init_admin.py      # Create admin user
│   ├── seed_data.py       # Seed VIIT data
│   └── requirements.txt   # Python dependencies
├── src/                   # Frontend (React)
│   ├── pages/            # All UI pages
│   ├── components/       # Reusable components
│   └── services/api.ts   # API calls
├── package.json          # Node.js dependencies
└── README.md             # Main documentation
```

---

## 🔥 **Quick Start (After First Setup)**

**Next time you want to run the system:**

1. **Start Docker Desktop** (if not running)
2. **Terminal 1:** `docker run -p 6333:6333 qdrant/qdrant`
3. **Terminal 2:** `cd Model && venv\Scripts\activate && python main.py`
4. **Terminal 3:** `npm run dev`

**Open:** http://localhost:5173

---

## ✅ **Features Working**

- ✅ Face registration (unlimited photos per student)
- ✅ Webcam support for attendance
- ✅ Real student counts (no placeholders)
- ✅ Enrollment management
- ✅ Schedule management
- ✅ Face management (view/delete faces)
- ✅ VIIT-specific credentials and data

---

## 📞 **Need Help?**

Check these files:
- `MANUAL_START.md` - Detailed Linux/Windows instructions
- `PHOTO_UPLOAD_GUIDE.md` - How to upload face photos
- `QDRANT_SETUP.md` - Qdrant database setup
- `SYSTEM_OVERVIEW.md` - System architecture

---

**Made for VIIT (Vishwakarma Institute of Information Technology)** 🎓

