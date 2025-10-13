from fastapi import FastAPI, Form, UploadFile, File, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
import io
from qdrant_client import models, QdrantClient
import torch
import uuid
import os
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import datetime

# Import local modules
from database import get_db, init_db, User, Subject, Enrollment, AttendanceSession, AttendanceRecord, Schedule
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    require_role
)
from schemas import (
    UserCreate, UserUpdate, UserResponse,
    SubjectCreate, SubjectUpdate, SubjectResponse,
    AttendanceSessionCreate, AttendanceSessionResponse,
    AttendanceRecordCreate, AttendanceRecordResponse,
    LoginRequest, LoginResponse,
    ImageProcessingResponse, DetectedStudent,
    EnrollmentCreate, StudentAttendanceStats, StudentAttendanceResponse
)

# --------------------------
# Qdrant Setup
# --------------------------
client = QdrantClient("http://localhost:6333")
COLLECTION_NAME = "Student_Faces"

def create_collection(size: int) -> None:
    try:
        collections = client.get_collections()
        existing = [c.name for c in collections.collections]
        
        if COLLECTION_NAME not in existing:
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(size=size, distance=models.Distance.COSINE)
            )
            print(f"✅ Collection '{COLLECTION_NAME}' created.")
        else:
            print(f"ℹ️  Collection '{COLLECTION_NAME}' already exists.")
    except Exception as e:
        print(f"❌ Error creating collection: {e}")

# Initialize collection
create_collection(512)

# --------------------------
# FastAPI Setup
# --------------------------
app = FastAPI(
    title="Smart Attendance System with Face Recognition",
    description="AI-powered attendance system using CNN for face detection in group photos",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Face models (global)
mtcnn = MTCNN(keep_all=False, device='cpu')
resnet = InceptionResnetV1(pretrained='vggface2').eval()

# Create uploads directory
os.makedirs("uploads", exist_ok=True)

# Initialize database
init_db()

# --------------------------
# Authentication Routes
# --------------------------
@app.post("/api/auth/login", response_model=LoginResponse, tags=["Authentication"])
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")
    
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=UserResponse, tags=["Authentication"])
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current logged-in user"""
    return current_user

# --------------------------
# User Management Routes
# --------------------------
@app.post("/api/users", response_model=UserResponse, tags=["Users"])
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Create a new user (admin only)"""
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if PRN already exists (for students)
    if user_data.prn and db.query(User).filter(User.prn == user_data.prn).first():
        raise HTTPException(status_code=400, detail="PRN already registered")
    
    user = User(
        name=user_data.name,
        email=user_data.email,
        prn=user_data.prn,
        role=user_data.role,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.get("/api/users", response_model=List[UserResponse], tags=["Users"])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    role: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all users with filters"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            (User.name.contains(search)) | 
            (User.email.contains(search)) |
            (User.prn.contains(search))
        )
    
    users = query.offset(skip).limit(limit).all()
    return users

@app.get("/api/users/teachers/list", response_model=List[UserResponse], tags=["Users"])
async def get_teachers(
    db: Session = Depends(get_db)
):
    """Get all teachers"""
    return db.query(User).filter(User.role == "teacher", User.is_active == True).all()

@app.get("/api/users/students/list", response_model=List[UserResponse], tags=["Users"])
async def get_students(
    db: Session = Depends(get_db)
):
    """Get all students"""
    return db.query(User).filter(User.role == "student", User.is_active == True).all()

@app.put("/api/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Update user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/users/{user_id}", tags=["Users"])
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete user (admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# --------------------------
# Face Registration Routes
# --------------------------
@app.post("/api/students/{student_id}/register-face", tags=["Face Recognition"])
async def register_student_face(
    student_id: int,
    img: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a student's face for recognition"""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    try:
        img_bytes = await img.read()
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Detect and crop face
        face_tensor = mtcnn(pil_img)
        if face_tensor is None:
            return JSONResponse(status_code=400, content={"error": "No face detected in the image."})
        
        # Generate embedding
        with torch.no_grad():
            embedding = resnet(face_tensor.unsqueeze(0))
        embedding = embedding.detach().cpu().numpy()[0]
        
        # Store in Qdrant
        metadata = {
            "user_id": student.id,
            "prn": student.prn,
            "name": student.name,
            "email": student.email,
            "registered_at": datetime.utcnow().isoformat()
        }
        
        client.upsert(
            collection_name=COLLECTION_NAME,
            points=[
                models.PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding.tolist(),
                    payload=metadata
                )
            ]
        )
        
        # Update user record
        student.face_registered = True
        db.commit()
        
        return {"status": "registered", "student": student.name, "message": "Face registered successfully"}
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# --------------------------
# Subject Management Routes
# --------------------------
@app.post("/api/subjects", response_model=SubjectResponse, tags=["Subjects"])
async def create_subject(
    subject_data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Create a new subject"""
    if db.query(Subject).filter(Subject.code == subject_data.code).first():
        raise HTTPException(status_code=400, detail="Subject code already exists")
    
    subject = Subject(**subject_data.dict())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@app.get("/api/subjects", response_model=List[SubjectResponse], tags=["Subjects"])
async def get_subjects(
    skip: int = 0,
    limit: int = 100,
    teacher_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all subjects"""
    query = db.query(Subject)
    
    if teacher_id:
        query = query.filter(Subject.teacher_id == teacher_id)
    if search:
        query = query.filter(
            (Subject.name.contains(search)) | (Subject.code.contains(search))
        )
    
    subjects = query.offset(skip).limit(limit).all()
    return subjects

@app.get("/api/subjects/{subject_id}/students", tags=["Subjects"])
async def get_subject_students(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all students enrolled in a subject"""
    enrollments = db.query(Enrollment).filter(Enrollment.subject_id == subject_id).all()
    students = []
    for enrollment in enrollments:
        student = enrollment.student
        students.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "prn": student.prn,
            "enrollment_date": enrollment.enrollment_date.isoformat()
        })
    return students

@app.post("/api/subjects/{subject_id}/enroll", tags=["Subjects"])
async def enroll_student(
    subject_id: int,
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin", "teacher"]))
):
    """Enroll a student in a subject"""
    # Check if already enrolled
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == enrollment_data.student_id,
        Enrollment.subject_id == subject_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")
    
    enrollment = Enrollment(
        student_id=enrollment_data.student_id,
        subject_id=subject_id
    )
    db.add(enrollment)
    db.commit()
    return {"message": "Student enrolled successfully"}

@app.put("/api/subjects/{subject_id}", response_model=SubjectResponse, tags=["Subjects"])
async def update_subject(
    subject_id: int,
    subject_data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Update subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    for field, value in subject_data.dict(exclude_unset=True).items():
        setattr(subject, field, value)
    
    subject.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(subject)
    return subject

@app.delete("/api/subjects/{subject_id}", tags=["Subjects"])
async def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete subject"""
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(subject)
    db.commit()
    return {"message": "Subject deleted successfully"}

# --------------------------
# Attendance Routes
# --------------------------
@app.post("/api/attendance/sessions", response_model=AttendanceSessionResponse, tags=["Attendance"])
async def create_attendance_session(
    session_data: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher"]))
):
    """Create a new attendance session"""
    # Get total enrolled students
    total_students = db.query(Enrollment).filter(
        Enrollment.subject_id == session_data.subject_id
    ).count()
    
    session = AttendanceSession(
        subject_id=session_data.subject_id,
        teacher_id=current_user.id,
        session_date=session_data.session_date,
        class_type=session_data.class_type,
        notes=session_data.notes,
        total_students=total_students
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@app.post("/api/attendance/sessions/{session_id}/upload-image", response_model=ImageProcessingResponse, tags=["Attendance"])
async def upload_attendance_image(
    session_id: int,
    image: UploadFile = File(...),
    threshold: float = 0.6,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher"]))
):
    """Upload group photo and detect students"""
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    try:
        # Save image
        img_bytes = await image.read()
        img_path = f"uploads/session_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        with open(img_path, "wb") as f:
            f.write(img_bytes)
        
        session.image_path = img_path
        session.status = "processing"
        db.commit()
        
        # Process image for face detection
        pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        
        # Detect faces with keep_all=True
        mtcnn_crowd = MTCNN(keep_all=True, device='cpu')
        face_tensors, probs = mtcnn_crowd(pil_img, return_prob=True)
        
        if face_tensors is None:
            session.status = "completed"
            db.commit()
            return JSONResponse(status_code=400, content={"error": "No faces detected in the image."})
        
        # Get all enrolled students
        enrollments = db.query(Enrollment).filter(
            Enrollment.subject_id == session.subject_id
        ).all()
        enrolled_student_ids = {e.student_id for e in enrollments}
        
        detected_students = []
        detected_ids = set()
        
        # Process each detected face
        for idx, face_tensor in enumerate(face_tensors):
            with torch.no_grad():
                embedding = resnet(face_tensor.unsqueeze(0))
            embedding = embedding.detach().cpu().numpy()[0]
            
            # Search in Qdrant
            search_result = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=embedding.tolist(),
                limit=1
            )
            
            if search_result and search_result[0].score >= threshold:
                student_data = search_result[0].payload
                student_id = student_data["user_id"]
                
                # Only mark if enrolled in this subject
                if student_id in enrolled_student_ids and student_id not in detected_ids:
                    detected_ids.add(student_id)
                    
                    # Create attendance record
                    record = AttendanceRecord(
                        session_id=session_id,
                        student_id=student_id,
                        status="present",
                        confidence_score=float(search_result[0].score),
                        manual_override=False
                    )
                    db.add(record)
                    
                    student = db.query(User).filter(User.id == student_id).first()
                    detected_students.append(DetectedStudent(
                        student_id=student_id,
                        name=student.name,
                        email=student.email,
                        prn=student.prn,
                        detected=True,
                        confidence=float(search_result[0].score),
                        face_index=idx
                    ))
        
        # Mark absent students
        for enrollment in enrollments:
            if enrollment.student_id not in detected_ids:
                student = enrollment.student
                record = AttendanceRecord(
                    session_id=session_id,
                    student_id=enrollment.student_id,
                    status="absent",
                    manual_override=False
                )
                db.add(record)
                
                detected_students.append(DetectedStudent(
                    student_id=student.id,
                    name=student.name,
                    email=student.email,
                    prn=student.prn,
                    detected=False
                ))
        
        session.present_students = len(detected_ids)
        session.status = "completed"
        db.commit()
        
        return ImageProcessingResponse(
            session_id=session_id,
            detected_students=detected_students,
            total_detected=len(detected_ids),
            processing_status="completed"
        )
    
    except Exception as e:
        session.status = "error"
        db.commit()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/api/attendance/sessions", response_model=List[AttendanceSessionResponse], tags=["Attendance"])
async def get_attendance_sessions(
    subject_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance sessions"""
    query = db.query(AttendanceSession)
    
    if subject_id:
        query = query.filter(AttendanceSession.subject_id == subject_id)
    if teacher_id:
        query = query.filter(AttendanceSession.teacher_id == teacher_id)
    if start_date:
        query = query.filter(AttendanceSession.session_date >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(AttendanceSession.session_date <= datetime.fromisoformat(end_date))
    
    sessions = query.order_by(AttendanceSession.session_date.desc()).all()
    return sessions

@app.get("/api/attendance/sessions/{session_id}/records", response_model=List[AttendanceRecordResponse], tags=["Attendance"])
async def get_session_attendance(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance records for a session"""
    records = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id
    ).all()
    return records

@app.post("/api/attendance/sessions/{session_id}/records", response_model=AttendanceRecordResponse, tags=["Attendance"])
async def mark_attendance(
    session_id: int,
    attendance_data: AttendanceRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher"]))
):
    """Manually mark/update attendance"""
    # Check if record exists
    existing = db.query(AttendanceRecord).filter(
        AttendanceRecord.session_id == session_id,
        AttendanceRecord.student_id == attendance_data.student_id
    ).first()
    
    if existing:
        existing.status = attendance_data.status
        existing.manual_override = True
        existing.notes = attendance_data.notes
        db.commit()
        db.refresh(existing)
        return existing
    else:
        record = AttendanceRecord(
            session_id=session_id,
            student_id=attendance_data.student_id,
            status=attendance_data.status,
            notes=attendance_data.notes,
            manual_override=True
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record

@app.get("/api/attendance/student/{student_id}", response_model=StudentAttendanceResponse, tags=["Attendance"])
async def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get attendance statistics for a student"""
    student = db.query(User).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get enrollments
    enrollments = db.query(Enrollment).filter(Enrollment.student_id == student_id).all()
    
    subject_stats = []
    total_classes = 0
    total_attended = 0
    
    for enrollment in enrollments:
        subject = enrollment.subject
        
        # Get all sessions for this subject
        sessions = db.query(AttendanceSession).filter(
            AttendanceSession.subject_id == subject.id,
            AttendanceSession.status == "completed"
        ).all()
        
        session_count = len(sessions)
        
        # Count attended sessions
        attended = db.query(AttendanceRecord).filter(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.session_id.in_([s.id for s in sessions]),
            AttendanceRecord.status == "present"
        ).count()
        
        percentage = (attended / session_count * 100) if session_count > 0 else 0
        
        subject_stats.append(StudentAttendanceStats(
            subject_id=subject.id,
            subject_name=subject.name,
            total_classes=session_count,
            attended_classes=attended,
            attendance_percentage=round(percentage, 2)
        ))
        
        total_classes += session_count
        total_attended += attended
    
    overall_percentage = (total_attended / total_classes * 100) if total_classes > 0 else 0
    
    return StudentAttendanceResponse(
        student=student,
        subjects=subject_stats,
        overall_percentage=round(overall_percentage, 2)
    )

# --------------------------
# Schedule Management Routes
# --------------------------
@app.get("/api/schedules", tags=["Schedule Management"])
async def get_schedules(
    teacher_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    student_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get schedules - teachers see their schedules, students see their enrolled subjects' schedules"""
    try:
        query = db.query(Schedule)
        
        if current_user.role == "teacher":
            # Teachers see their own schedules
            query = query.filter(Schedule.teacher_id == current_user.id)
        elif current_user.role == "student":
            # Students see schedules for their enrolled subjects
            enrolled_subjects = db.query(Enrollment.subject_id).filter(Enrollment.student_id == current_user.id).all()
            subject_ids = [e.subject_id for e in enrolled_subjects]
            if subject_ids:
                query = query.filter(Schedule.subject_id.in_(subject_ids))
            else:
                return []
        
        # Apply additional filters if provided
        if teacher_id:
            query = query.filter(Schedule.teacher_id == teacher_id)
        if subject_id:
            query = query.filter(Schedule.subject_id == subject_id)
            
        schedules = query.all()
        
        # Format response
        result = []
        for schedule in schedules:
            subject = db.query(Subject).filter(Subject.id == schedule.subject_id).first()
            teacher = db.query(User).filter(User.id == schedule.teacher_id).first()
            
            result.append({
                "id": schedule.id,
                "subject_id": schedule.subject_id,
                "subject_name": subject.name if subject else "Unknown",
                "teacher_id": schedule.teacher_id,
                "teacher_name": teacher.name if teacher else "Unknown",
                "day_of_week": schedule.day_of_week,
                "start_time": schedule.start_time,
                "end_time": schedule.end_time,
                "room": schedule.room,
                "class_type": schedule.class_type,
                "created_at": schedule.created_at.isoformat()
            })
        
        return result
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/schedules", tags=["Schedule Management"])
async def create_schedule(
    subject_id: int = Form(...),
    teacher_id: int = Form(...),
    day_of_week: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    room: str = Form(None),
    class_type: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Create a new schedule (admin only)"""
    try:
        # Verify subject and teacher exist
        subject = db.query(Subject).filter(Subject.id == subject_id).first()
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        
        # Create new schedule
        schedule = Schedule(
            subject_id=subject_id,
            teacher_id=teacher_id,
            day_of_week=day_of_week,
            start_time=start_time,
            end_time=end_time,
            room=room,
            class_type=class_type
        )
        
        db.add(schedule)
        db.commit()
        db.refresh(schedule)
        
        return {
            "id": schedule.id,
            "subject_id": schedule.subject_id,
            "teacher_id": schedule.teacher_id,
            "day_of_week": schedule.day_of_week,
            "start_time": schedule.start_time,
            "end_time": schedule.end_time,
            "room": schedule.room,
            "class_type": schedule.class_type,
            "message": "Schedule created successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.delete("/api/schedules/{schedule_id}", tags=["Schedule Management"])
async def delete_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """Delete a schedule (admin only)"""
    try:
        schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
        if not schedule:
            raise HTTPException(status_code=404, detail="Schedule not found")
        
        db.delete(schedule)
        db.commit()
        
        return {"message": "Schedule deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        return JSONResponse(status_code=500, content={"error": str(e)})

# --------------------------
# Health Check
# --------------------------
@app.get("/", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Smart Attendance System",
        "version": "1.0.1 - AUTH BYPASS"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

