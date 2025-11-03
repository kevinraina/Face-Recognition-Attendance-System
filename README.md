# Face Recognition Attendance System

AI-powered attendance management system using face recognition to automatically mark attendance from group photos.

## Features

- **Face Recognition**: Upload group photos and automatically detect students
- **Multi-Role System**: Admin, Teacher, and Student portals
- **Real-Time Tracking**: View attendance statistics and reports
- **Unidentified Detection**: Shows unknown persons in photos who aren't enrolled
- **Schedule Management**: Manage class schedules and subjects
- **Persistent Storage**: Face data persists across restarts

## Tech Stack

- **Backend**: Python, FastAPI, PyTorch
- **Frontend**: React, TypeScript, Tailwind CSS
- **AI Models**: MTCNN (face detection) + FaceNet (embeddings)
- **Database**: SQLite + Qdrant (vector DB)

## Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Docker Desktop

### Setup

1. **Start Qdrant (Vector Database)**
```bash
docker run -d -p 6333:6333 -v qdrant_storage:/qdrant/storage qdrant/qdrant
```

2. **Start Backend**
```bash
cd Model
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python main.py
```

3. **Start Frontend**
```bash
npm install
npm run dev
```

4. **Access**: http://localhost:5173

## Default Login

- **Admin**: admin@viit.ac.in / viit@admin123
- **Teacher**: rajesh@viit.ac.in / teacher123
- **Student**: aarav@viit.ac.in / student123

## Usage

1. **Admin**: Create users and subjects
2. **Admin/Students**: Upload 3-5 face photos per student
3. **Teacher**: Upload group photos to mark attendance
4. **System**: Automatically identifies students and marks attendance

## Project Structure

```
├── Model/           # Backend (FastAPI + AI)
├── src/             # Frontend (React + TypeScript)
├── public/          # Static files
└── HOW_TO_START.md  # Detailed startup guide
```

---


