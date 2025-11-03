from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str

class UserCreate(UserBase):
    password: str
    prn: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: int
    prn: Optional[str] = None
    is_active: bool
    face_registered: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Subject Schemas
class SubjectBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    teacher_id: Optional[int] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[int] = None
    is_active: Optional[bool] = None

class SubjectResponse(SubjectBase):
    id: int
    teacher_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    teacher: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Attendance Schemas
class AttendanceSessionCreate(BaseModel):
    subject_id: int
    session_date: datetime
    class_type: str
    notes: Optional[str] = None

class AttendanceSessionResponse(BaseModel):
    id: int
    subject_id: int
    teacher_id: int
    session_date: datetime
    class_type: str
    image_path: Optional[str] = None
    total_students: int
    present_students: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AttendanceRecordCreate(BaseModel):
    student_id: int
    status: str
    notes: Optional[str] = None

class AttendanceRecordResponse(BaseModel):
    id: int
    session_id: int
    student_id: int
    status: str
    confidence_score: Optional[float] = None
    manual_override: bool
    notes: Optional[str] = None
    marked_at: datetime
    student: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class DetectedStudent(BaseModel):
    student_id: int
    name: str
    email: str
    prn: Optional[str] = None
    detected: bool
    confidence: Optional[float] = None
    face_index: Optional[int] = None

class UnidentifiedPerson(BaseModel):
    face_index: int
    confidence: Optional[float] = None
    reason: str = "No match found in database"

class ImageProcessingResponse(BaseModel):
    session_id: int
    detected_students: List[DetectedStudent]
    unidentified_persons: List[UnidentifiedPerson]
    total_detected: int
    total_unidentified: int
    processing_status: str

# Auth Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class EnrollmentCreate(BaseModel):
    student_id: int
    subject_id: int

class StudentAttendanceStats(BaseModel):
    subject_id: int
    subject_name: str
    total_classes: int
    attended_classes: int
    attendance_percentage: float

class StudentAttendanceResponse(BaseModel):
    student: UserResponse
    subjects: List[StudentAttendanceStats]
    overall_percentage: float

