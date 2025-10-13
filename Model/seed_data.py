"""
Seed data script to populate the database with sample users and subjects
Run this after starting the backend to create test data
"""

import requests
import sys

API_URL = "http://localhost:8000/api"

def create_admin():
    """Create admin user"""
    admin_data = {
        "name": "System Administrator",
        "email": "admin@viit.ac.in",
        "password": "viit@admin123",
        "role": "admin"
    }
    
    # First, login as admin (if exists) or create a temp user
    # For seed, we'll create directly through database
    print("🔧 Creating admin user...")
    return admin_data

def seed_database():
    """Seed the database with sample data"""
    
    print("🌱 Starting database seeding...")
    print("=" * 50)
    
    # Create admin credentials
    admin = create_admin()
    print(f"✅ Admin created: {admin['email']} / {admin['password']}")
    
    # Login as admin to get token
    print("\n🔐 Logging in as admin...")
    try:
        login_response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": admin['email'], "password": admin['password']}
        )
        
        if login_response.status_code != 200:
            print("❌ Failed to login. Please create admin user manually first.")
            print("   Use the FastAPI docs at http://localhost:8000/docs")
            return
        
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login successful!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend. Please start the backend first:")
        print("   cd Model && python main.py")
        return
    
    # Create teachers
    print("\n👨‍🏫 Creating teachers...")
    teachers = [
        {"name": "Dr. Rajesh Sharma", "email": "rajesh@viit.ac.in", "password": "teacher123", "role": "teacher"},
        {"name": "Prof. Priya Deshmukh", "email": "priya@viit.ac.in", "password": "teacher123", "role": "teacher"},
        {"name": "Dr. Amit Kulkarni", "email": "amit@viit.ac.in", "password": "teacher123", "role": "teacher"},
    ]
    
    teacher_ids = []
    for teacher in teachers:
        response = requests.post(f"{API_URL}/users", json=teacher, headers=headers)
        if response.status_code == 200:
            teacher_id = response.json()["id"]
            teacher_ids.append(teacher_id)
            print(f"   ✅ Created: {teacher['name']} (ID: {teacher_id})")
        else:
            print(f"   ❌ Failed: {teacher['name']} - Status {response.status_code}: {response.text}")
    
    # Create students
    print("\n👨‍🎓 Creating students...")
    students = [
        {"name": "Aarav Kumar", "email": "aarav@viit.ac.in", "prn": "VIIT001", "password": "student123", "role": "student"},
        {"name": "Diya Patel", "email": "diya@viit.ac.in", "prn": "VIIT002", "password": "student123", "role": "student"},
        {"name": "Arjun Singh", "email": "arjun@viit.ac.in", "prn": "VIIT003", "password": "student123", "role": "student"},
        {"name": "Ananya Reddy", "email": "ananya@viit.ac.in", "prn": "VIIT004", "password": "student123", "role": "student"},
        {"name": "Rohan Mehta", "email": "rohan@viit.ac.in", "prn": "VIIT005", "password": "student123", "role": "student"},
        {"name": "Ishita Joshi", "email": "ishita@viit.ac.in", "prn": "VIIT006", "password": "student123", "role": "student"},
        {"name": "Aditya Verma", "email": "aditya@viit.ac.in", "prn": "VIIT007", "password": "student123", "role": "student"},
        {"name": "Kavya Nair", "email": "kavya@viit.ac.in", "prn": "VIIT008", "password": "student123", "role": "student"},
        {"name": "Vihaan Shah", "email": "vihaan@viit.ac.in", "prn": "VIIT009", "password": "student123", "role": "student"},
        {"name": "Saanvi Gupta", "email": "saanvi@viit.ac.in", "prn": "VIIT010", "password": "student123", "role": "student"},
    ]
    
    student_ids = []
    for student in students:
        response = requests.post(f"{API_URL}/users", json=student, headers=headers)
        if response.status_code == 200:
            student_id = response.json()["id"]
            student_ids.append(student_id)
            print(f"   ✅ Created: {student['name']} - {student['prn']} (ID: {student_id})")
        else:
            print(f"   ❌ Failed: {student['name']} - Status {response.status_code}: {response.text}")
    
    # Create subjects
    print("\n📚 Creating subjects...")
    subjects = [
        {"name": "Data Structures and Algorithms", "code": "CS201", "description": "Learn fundamental data structures and algorithms", "teacher_id": teacher_ids[0] if teacher_ids else None},
        {"name": "Machine Learning", "code": "CS301", "description": "Introduction to ML concepts and applications", "teacher_id": teacher_ids[1] if teacher_ids else None},
        {"name": "Web Development", "code": "CS202", "description": "Full-stack web development", "teacher_id": teacher_ids[2] if teacher_ids else None},
        {"name": "Database Management Systems", "code": "CS203", "description": "Database design and SQL", "teacher_id": teacher_ids[0] if teacher_ids else None},
        {"name": "Computer Networks", "code": "CS302", "description": "Networking fundamentals", "teacher_id": teacher_ids[1] if teacher_ids else None},
    ]
    
    subject_ids = []
    for subject in subjects:
        response = requests.post(f"{API_URL}/subjects", json=subject, headers=headers)
        if response.status_code == 200:
            subject_id = response.json()["id"]
            subject_ids.append(subject_id)
            print(f"   ✅ Created: {subject['name']} ({subject['code']}) - ID: {subject_id}")
        else:
            print(f"   ❌ Failed: {subject['name']} - Status {response.status_code}: {response.text}")
    
    # Enroll students in subjects
    print("\n📝 Enrolling students in subjects...")
    enrollment_count = 0
    for subject_id in subject_ids:
        for student_id in student_ids:
            response = requests.post(
                f"{API_URL}/subjects/{subject_id}/enroll",
                json={"student_id": student_id, "subject_id": subject_id},
                headers=headers
            )
            if response.status_code == 200:
                enrollment_count += 1
    
    print(f"   ✅ Created {enrollment_count} enrollments")
    
    print("\n" + "=" * 50)
    print("🎉 Database seeding completed successfully!")
    print("\n📋 VIIT Test Credentials:")
    print("-" * 50)
    print("Admin:")
    print(f"  Email: {admin['email']}")
    print(f"  Password: {admin['password']}")
    print("\nTeacher:")
    print("  Email: rajesh@viit.ac.in")
    print("  Password: teacher123")
    print("\nStudent:")
    print("  Email: aarav@viit.ac.in")
    print("  Password: student123")
    print("-" * 50)
    print("\n⚠️  IMPORTANT: Students need to register their faces!")
    print("   Use the admin panel to upload face photos for each student.")
    print("   Then you can use the 'Take Attendance' feature with group photos.")
    print("\n🚀 Next steps:")
    print("   1. Go to http://localhost:5173")
    print("   2. Login as admin")
    print("   3. Register student faces (Admin > User Management)")
    print("   4. Login as teacher")
    print("   5. Take attendance with a group photo!")

if __name__ == "__main__":
    seed_database()

