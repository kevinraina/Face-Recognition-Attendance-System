# 🚀 VIIT Smart Attendance - Startup Guide (Linux/Fedora)

## ✅ Quick Start (Two Terminals)

### Terminal 1: Backend
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python main.py
```

### Terminal 2: Frontend
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN
npm run dev
```

Then visit: **`http://localhost:5173`**

---

## 📋 Full Step-by-Step Instructions

### 1️⃣ Start Backend (Python/FastAPI)

```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python main.py
```

**What this does:**
- Activates Python virtual environment
- Starts FastAPI server on `http://localhost:8000`
- Initializes Qdrant vector database for face embeddings
- Creates all database tables if they don't exist

**Verify backend is running:**
```bash
curl http://localhost:8000
# Should return: {"status":"healthy","service":"Smart Attendance System",...}
```

Or visit API docs: **`http://localhost:8000/docs`**

---

### 2️⃣ Start Frontend (React/Vite)

In a **NEW terminal**:

```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN
npm run dev
```

Frontend will run on: **`http://localhost:5173`**

---

### 3️⃣ Login Credentials

Visit `http://localhost:5173` and use:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@viit.ac.in` | `viit@admin123` |
| **Teacher** | `rajesh@viit.ac.in` | `teacher123` |
| **Student** | `aarav@viit.ac.in` | `student123` |

---

## 🗄️ Seeding Data (One-Time Setup)

### Option A: Seed Complete VIIT Data (Recommended)
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python seed_data.py
```

**Creates:**
- 1 Admin user
- 3 Teachers (including Rajesh Sharma)
- 10 Students (including Aarav Kumar)
- 5 Subjects with teacher assignments
- Student enrollments in subjects

### Option B: Initialize Admin Only
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python init_admin.py
```

**Creates:**
- Admin user: `admin@viit.ac.in` / `viit@admin123`

### Option C: Direct Database Seeding
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python seed_direct.py
```

---

## 🔧 Troubleshooting

### Backend Issues

**Missing Dependencies:**
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
pip install tqdm email-validator
```

**Backend won't start:**
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill existing process
pkill -f "python main.py"
```

**Restart backend:**
```bash
pkill -f "python main.py" && sleep 2
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python main.py
```

### Frontend Issues

**Frontend won't start:**
```bash
# Check if port 5173 is already in use
lsof -i :5173

# Kill existing process
pkill -f "vite"
```

**Frontend syntax errors:**
Check console for errors. Usually fixed by restarting Vite dev server.

### Database Issues

**Reset database completely:**
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
rm attendance_system.db
source venv/bin/activate
python seed_data.py
```

**Check database location:**
```bash
ls -lh /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model/attendance_system.db
```

### Qdrant Vector Database

Qdrant runs **in-memory** automatically when you start `main.py` - no Docker needed on Linux!

If you get Qdrant errors, restart the backend and it will reinitialize Qdrant.

---

## 📁 Important Files

- **`Model/main.py`**: Main FastAPI backend server
- **`Model/seed_data.py`**: Populates database with VIIT data
- **`Model/init_admin.py`**: Creates admin user only
- **`Model/seed_direct.py`**: Alternative seeding method
- **`Model/database.py`**: Database models (User, Subject, Attendance, Schedule)
- **`Model/auth.py`**: Authentication and password hashing
- **`Model/requirements.txt`**: Python dependencies
- **`src/services/api.ts`**: Frontend API client
- **`src/contexts/AuthContext.tsx`**: Authentication context

---

## 🎯 System Features

### Admin Dashboard
- **User Management**: Create/edit/delete users (admin, teacher, student)
- **Subject Management**: Create subjects and assign teachers
- **Face Photo Management**: View/delete individual student face photos
- **Schedule Management**: Create class schedules (day, time, room, subject)
- **System Analytics**: View attendance statistics and trends

### Teacher Dashboard
- **Take Attendance**: Upload group photo → AI detects students automatically
- **View Attendance**: See all attendance sessions and individual records
- **View Schedule**: See teaching schedule with room numbers
- **View Subjects**: See all assigned subjects

### Student Dashboard
- **View Attendance**: See attendance percentage per subject
- **View Schedule**: See class schedule with teachers and rooms
- **Register Face**: Upload 3-5 photos for face recognition (unlimited uploads supported)

---

## 🖼️ Face Recognition Workflow

1. **Admin** creates student accounts
2. **Admin or Student** uploads face photos (3-5 photos recommended, unlimited supported)
3. **Backend** processes photos:
   - MTCNN detects faces in each photo
   - FaceNet generates 512-dimensional embeddings
   - Qdrant stores embeddings with metadata
4. **Teacher** takes attendance:
   - Uploads group photo during class
   - Backend detects all faces in photo
   - Matches each face against stored embeddings
   - Returns matching students with confidence scores
5. **System** marks attendance automatically
6. **Students** can view their attendance records

---

## 🔐 Security & Technology

### Backend
- **FastAPI**: High-performance async Python web framework
- **SQLAlchemy**: ORM for SQLite database
- **bcrypt**: Password hashing
- **JWT**: Token-based authentication (24-hour expiry)
- **CORS**: Configured for localhost only

### Face Recognition
- **MTCNN**: Multi-task CNN for face detection
- **FaceNet (InceptionResnetV1)**: Face embedding generation (512-d vectors)
- **Qdrant**: Vector database for similarity search
- **PyTorch**: Deep learning framework

### Frontend
- **React 18**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Shadcn UI**: Beautiful component library
- **Tailwind CSS**: Utility-first CSS

### Database Schema
- **Users**: id, name, email, password_hash, role, prn, face_registered
- **Subjects**: id, name, code, teacher_id
- **Enrollments**: student_id, subject_id
- **AttendanceSession**: id, subject_id, teacher_id, photo_path, date
- **AttendanceRecord**: session_id, student_id, status, confidence
- **Schedule**: id, subject_id, teacher_id, day_of_week, start_time, end_time, room

---

## 📞 Need Help?

### Check Logs
- **Backend logs**: Check terminal where `python main.py` is running
- **Frontend logs**: Check terminal where `npm run dev` is running
- **Browser console**: Press F12 in browser to see frontend errors

### API Documentation
Visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI)

### Common Issues
1. **"Connection refused"**: Backend not running → start backend first
2. **"Unauthorized"**: Token expired → logout and login again
3. **"Face not detected"**: Photo quality too poor → use clear, well-lit photos
4. **"No matching student"**: Face not registered → upload face photos first

---

## 🎉 Success Checklist

- [ ] Backend running on `http://localhost:8000`
- [ ] Frontend running on `http://localhost:5173`
- [ ] Database seeded with VIIT data
- [ ] Can login as admin/teacher/student
- [ ] Can create new users
- [ ] Can upload face photos (Fedora file picker works)
- [ ] Can take attendance with group photo
- [ ] Can view attendance records
- [ ] Can view schedules

---

**You're all set!** 🚀

Login as admin (`admin@viit.ac.in` / `viit@admin123`) and start exploring!
