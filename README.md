# VIIT Smart Attendance System

**Real-Time Person Detection and Attendance Tracking using Deep Learning**

[![Python 3.13](https://img.shields.io/badge/python-3.13-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg)](https://www.typescriptlang.org/)

---

## 📋 Overview

A professional attendance management system built for **Vishwakarma Institute of Information Technology (VIIT)** that uses deep learning-based face recognition to automatically mark attendance from group photos.

### Key Features

✅ **Face Recognition with MTCNN + FaceNet**  
✅ **Vector Database with Qdrant** for fast similarity search  
✅ **Multi-role System** (Admin, Teacher, Student)  
✅ **Unlimited Face Photo Uploads** (3-5 recommended)  
✅ **Group Photo Attendance** marking  
✅ **Schedule Management** with room numbers  
✅ **Real-time Analytics** and attendance tracking  
✅ **Mobile Responsive** PWA design  
✅ **Linux/Fedora Optimized** file handling  

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.13+** with `venv`
- **Node.js 18+** with `npm`
- **Linux/Fedora** (tested on Fedora Sway)

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/Real-Time-Person-Detection-in-Crowds-Using-CNN.git
cd Real-Time-Person-Detection-in-Crowds-Using-CNN

# Backend setup
cd Model
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Frontend setup
npm install
```

### Start the System

**Terminal 1: Backend**
```bash
cd Model
source venv/bin/activate
python init_admin.py    # First time only
python seed_data.py     # First time only
python main.py
```

**Terminal 2: Frontend**
```bash
npm run dev
```

Visit: **http://localhost:5173**

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@viit.ac.in` | `viit@admin123` |
| **Teacher** | `rajesh@viit.ac.in` | `teacher123` |
| **Student** | `aarav@viit.ac.in` | `student123` |

---

## 📊 System Architecture

```
┌─────────────────┐
│   React + TS    │  Frontend (Vite + Shadcn UI)
│  localhost:5173 │
└────────┬────────┘
         │ HTTP/REST
         ↓
┌─────────────────┐
│   FastAPI       │  Backend (Python 3.13)
│  localhost:8000 │
└────────┬────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ↓         ↓            ↓             ↓
┌────────┐ ┌──────┐  ┌─────────┐  ┌──────────┐
│ SQLite │ │Qdrant│  │  MTCNN  │  │ FaceNet  │
│  (DB)  │ │Vector│  │ (Detect)│  │(Embedding)│
└────────┘ └──────┘  └─────────┘  └──────────┘
```

### Technology Stack

**Backend:**
- FastAPI (async Python web framework)
- SQLAlchemy (ORM) + SQLite
- PyTorch + facenet-pytorch
- MTCNN (face detection)
- FaceNet InceptionResnetV1 (512-d embeddings)
- Qdrant (vector database, in-memory)
- bcrypt (password hashing)
- JWT (authentication)

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Shadcn UI + Tailwind CSS
- React Router (navigation)
- Lucide Icons

---

## 🖼️ Face Recognition Workflow

1. **Admin** creates student accounts in User Management
2. **Admin/Student** uploads 3-5 face photos per student
3. **Backend** processes photos:
   - MTCNN detects faces in each image
   - FaceNet generates 512-dimensional embeddings
   - Qdrant stores embeddings with metadata
4. **Teacher** uploads group photo in class
5. **AI** detects all faces and matches against database
6. **System** automatically marks attendance for recognized students
7. **Students** view attendance records in their dashboard

---

## 📁 Project Structure

```
Real-Time-Person-Detection-in-Crowds-Using-CNN/
├── Model/                      # Backend (Python/FastAPI)
│   ├── main.py                 # FastAPI application
│   ├── database.py             # SQLAlchemy models
│   ├── auth.py                 # Authentication (bcrypt + JWT)
│   ├── init_admin.py           # Admin user creation
│   ├── seed_data.py            # Database seeding
│   ├── requirements.txt        # Python dependencies
│   └── venv/                   # Python virtual environment
│
├── src/                        # Frontend (React/TypeScript)
│   ├── pages/                  # Page components
│   │   ├── admin/              # Admin pages
│   │   ├── teacher/            # Teacher pages
│   │   └── student/            # Student pages
│   ├── components/             # Reusable components
│   ├── contexts/               # React contexts (Auth)
│   ├── services/               # API service
│   └── lib/                    # Utilities
│
├── public/                     # Static assets
├── MANUAL_START.md             # Startup guide
├── check_system.sh             # Health check script
└── README.md                   # This file
```

---

## 🎯 Features by Role

### Admin Dashboard
- **User Management**: Create/edit/delete users (admin, teacher, student)
- **Subject Management**: Create subjects and assign teachers
- **Face Photo Management**: View/delete individual student photos
- **Schedule Management**: Create class schedules (day, time, room)
- **System Analytics**: View attendance statistics and trends

### Teacher Dashboard
- **Take Attendance**: Upload group photo → AI marks attendance
- **View Attendance**: See all sessions and individual records
- **View Schedule**: See teaching schedule with room numbers
- **View Subjects**: See all assigned subjects

### Student Dashboard
- **View Attendance**: See attendance percentage per subject
- **View Schedule**: See class schedule with teachers and rooms
- **Register Face**: Upload photos for face recognition

---

## 🛠️ Commands Cheat Sheet

```bash
# Check system health
./check_system.sh

# Start backend
cd Model && source venv/bin/activate && python main.py

# Start frontend
npm run dev

# Seed database
cd Model && source venv/bin/activate && python seed_data.py

# Reset database
cd Model && rm attendance_system.db && python init_admin.py && python seed_data.py

# Kill processes
pkill -f "python main.py"
pkill -f "vite"
```

---

## 🔐 Security Features

- **bcrypt** password hashing (salted)
- **JWT** token-based authentication (24-hour expiry)
- **Role-based access control** (RBAC)
- **CORS** configured for localhost only
- **SQL injection** protection via SQLAlchemy ORM
- **XSS** protection via React's built-in escaping

---

## 📸 Face Recognition Details

### MTCNN (Multi-task Cascaded Convolutional Networks)
- Detects faces in images
- Returns bounding boxes and facial landmarks
- Handles multiple faces per image

### FaceNet (InceptionResnetV1)
- Generates 512-dimensional face embeddings
- Pre-trained on VGGFace2 dataset
- L2-normalized embeddings for cosine similarity

### Qdrant Vector Database
- In-memory vector storage
- Fast similarity search (cosine distance)
- Threshold: 0.6 (adjustable in `main.py`)

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check for errors
cd Model && source venv/bin/activate && python main.py

# Common fixes
pip install tqdm email-validator bcrypt
pkill -f "python main.py" && python main.py
```

### Frontend won't start
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Login fails
```bash
# Reset admin password
cd Model && source venv/bin/activate
python init_admin.py
```

### Face upload stuck
- Use **JPG/PNG** images
- Keep file size **< 10MB**
- Use **clear, well-lit** photos
- Check browser console (F12) for errors

---

## 📊 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,  -- 'admin', 'teacher', 'student'
    prn TEXT,  -- Student ID (for students only)
    face_registered BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE subjects (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    teacher_id INTEGER REFERENCES users(id)
);

-- Enrollments table (students ↔ subjects)
CREATE TABLE enrollments (
    id INTEGER PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    subject_id INTEGER REFERENCES subjects(id)
);

-- Attendance sessions
CREATE TABLE attendance_sessions (
    id INTEGER PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES users(id),
    photo_path TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance records
CREATE TABLE attendance_records (
    id INTEGER PRIMARY KEY,
    session_id INTEGER REFERENCES attendance_sessions(id),
    student_id INTEGER REFERENCES users(id),
    status TEXT,  -- 'present', 'absent'
    confidence FLOAT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schedules
CREATE TABLE schedules (
    id INTEGER PRIMARY KEY,
    subject_id INTEGER REFERENCES subjects(id),
    teacher_id INTEGER REFERENCES users(id),
    day_of_week TEXT,  -- 'Monday', 'Tuesday', etc.
    start_time TEXT,   -- '09:00'
    end_time TEXT,     -- '10:00'
    room TEXT,         -- 'B101', 'Lab A'
    class_type TEXT,   -- 'Lecture', 'Lab', 'Tutorial'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **VIIT** (Vishwakarma Institute of Information Technology)
- **facenet-pytorch** by Tim Esler
- **Qdrant** vector database
- **FastAPI** by Sebastián Ramírez
- **Shadcn UI** component library

---

## 📞 Support

- **Documentation**: See `MANUAL_START.md`
- **Health Check**: Run `./check_system.sh`
- **API Docs**: http://localhost:8000/docs
- **Issues**: Open a GitHub issue

---

**Built with ❤️ for VIIT by Kevin**
