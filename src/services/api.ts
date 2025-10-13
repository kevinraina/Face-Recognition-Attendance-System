const API_BASE_URL = 'http://localhost:8000/api';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  description?: string;
  teacher_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  teacher?: User;
}

export interface AttendanceSession {
  id: number;
  subject_id: number;
  teacher_id: number;
  session_date: string;
  class_type: 'lecture' | 'lab' | 'tutorial';
  image_path?: string;
  total_students: number;
  present_students: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  status: 'present' | 'absent' | 'late';
  confidence_score?: string;
  manual_override: boolean;
  notes?: string;
  marked_at: string;
  student?: User;
}

export interface AttendanceStats {
  total_classes: number;
  attended_classes: number;
  attendance_percentage: number;
  subject_name: string;
  subject_id: number;
}

export interface StudentAttendanceResponse {
  student: User;
  subjects: AttendanceStats[];
  overall_percentage: number;
}

export interface ImageProcessingResponse {
  session_id: number;
  detected_students: Array<{
    student_id: number;
    name: string;
    email: string;
    detected: boolean;
    confidence?: string;
  }>;
  total_detected: number;
  processing_status: string;
}

// API Service Class
class ApiService {
  private token: string | null = null;

  constructor() {
    // Get token from localStorage on initialization
    this.token = localStorage.getItem('access_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.logout();
        throw new Error('Authentication failed. Please login again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await this.handleResponse<LoginResponse>(response);
    this.token = data.access_token;
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User>(response);
  }

  // Users
  async getUsers(params?: {
    skip?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<User[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.role) searchParams.append('role', params.role);
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/users?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User[]>(response);
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'teacher' | 'student';
    prn?: string;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<User>(response);
  }

  async updateUser(userId: number, userData: {
    name?: string;
    email?: string;
    role?: 'admin' | 'teacher' | 'student';
    is_active?: boolean;
  }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(userData),
    });

    return this.handleResponse<User>(response);
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  async getTeachers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/teachers/list`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User[]>(response);
  }

  async getStudents(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users/students/list`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<User[]>(response);
  }

  // Subjects
  async getSubjects(params?: {
    skip?: number;
    limit?: number;
    teacher_id?: number;
    search?: string;
  }): Promise<Subject[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.teacher_id) searchParams.append('teacher_id', params.teacher_id.toString());
    if (params?.search) searchParams.append('search', params.search);

    const response = await fetch(`${API_BASE_URL}/subjects?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Subject[]>(response);
  }

  async createSubject(subjectData: {
    name: string;
    code: string;
    description?: string;
    teacher_id?: number;
  }): Promise<Subject> {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(subjectData),
    });

    return this.handleResponse<Subject>(response);
  }

  async updateSubject(subjectId: number, subjectData: {
    name?: string;
    code?: string;
    description?: string;
    teacher_id?: number;
    is_active?: boolean;
  }): Promise<Subject> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(subjectData),
    });

    return this.handleResponse<Subject>(response);
  }

  async deleteSubject(subjectId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<{ message: string }>(response);
  }

  async getSubjectStudents(subjectId: number): Promise<Array<{
    id: number;
    name: string;
    email: string;
    enrollment_date: string;
  }>> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/students`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<Array<{
      id: number;
      name: string;
      email: string;
      enrollment_date: string;
    }>>(response);
  }

  async enrollStudent(subjectId: number, studentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}/enroll`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ student_id: studentId, subject_id: subjectId }),
    });

    return this.handleResponse<any>(response);
  }

  // Attendance
  async createAttendanceSession(sessionData: {
    subject_id: number;
    session_date: string;
    class_type: 'lecture' | 'lab' | 'tutorial';
    notes?: string;
  }): Promise<AttendanceSession> {
    const response = await fetch(`${API_BASE_URL}/attendance/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sessionData),
    });

    return this.handleResponse<AttendanceSession>(response);
  }

  async uploadAttendanceImage(sessionId: number, imageFile: File): Promise<ImageProcessingResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    return this.handleResponse<ImageProcessingResponse>(response);
  }

  async markAttendance(sessionId: number, attendanceData: {
    student_id: number;
    status: 'present' | 'absent' | 'late';
    notes?: string;
  }): Promise<AttendanceRecord> {
    const response = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/records`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(attendanceData),
    });

    return this.handleResponse<AttendanceRecord>(response);
  }

  async getSessionAttendance(sessionId: number): Promise<AttendanceRecord[]> {
    const response = await fetch(`${API_BASE_URL}/attendance/sessions/${sessionId}/records`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AttendanceRecord[]>(response);
  }

  async getStudentAttendance(studentId: number): Promise<StudentAttendanceResponse> {
    const response = await fetch(`${API_BASE_URL}/attendance/student/${studentId}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<StudentAttendanceResponse>(response);
  }

  async getAttendanceSessions(params?: {
    subject_id?: number;
    teacher_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<AttendanceSession[]> {
    const searchParams = new URLSearchParams();
    if (params?.subject_id) searchParams.append('subject_id', params.subject_id.toString());
    if (params?.teacher_id) searchParams.append('teacher_id', params.teacher_id.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    const response = await fetch(`${API_BASE_URL}/attendance/sessions?${searchParams}`, {
      headers: this.getHeaders(),
    });

    return this.handleResponse<AttendanceSession[]>(response);
  }

  // Schedule Management
  async getSchedules(params: { teacher_id?: number; subject_id?: number; student_id?: number } = {}): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params.teacher_id) {
      searchParams.append('teacher_id', params.teacher_id.toString());
    }
    if (params.subject_id) {
      searchParams.append('subject_id', params.subject_id.toString());
    }
    if (params.student_id) {
      searchParams.append('student_id', params.student_id.toString());
    }
    
    const response = await fetch(`${API_BASE_URL}/schedules?${searchParams}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async createSchedule(scheduleData: {
    subject_id: number;
    teacher_id: number;
    day_of_week: string;
    start_time: string;
    end_time: string;
    room?: string;
    class_type: string;
  }): Promise<any> {
    const formData = new FormData();
    formData.append('subject_id', scheduleData.subject_id.toString());
    formData.append('teacher_id', scheduleData.teacher_id.toString());
    formData.append('day_of_week', scheduleData.day_of_week);
    formData.append('start_time', scheduleData.start_time);
    formData.append('end_time', scheduleData.end_time);
    formData.append('class_type', scheduleData.class_type);
    if (scheduleData.room) {
      formData.append('room', scheduleData.room);
    }

    const response = await fetch(`${API_BASE_URL}/schedules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  async deleteSchedule(scheduleId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Get list of teachers
  async getTeachersList(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/users/teachers/list`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
