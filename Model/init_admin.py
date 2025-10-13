"""
Initialize admin user directly in the database
Run this ONCE before seeding data
"""

from database import SessionLocal, User, init_db
from auth import get_password_hash

def create_initial_admin():
    """Create the initial admin user"""
    init_db()
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@viit.ac.in").first()
        if existing_admin:
            print("✅ Admin user already exists!")
            print("   Email: admin@viit.ac.in")
            print("   Password: viit@admin123")
            return
        
        # Create admin user
        admin = User(
            name="System Administrator",
            email="admin@viit.ac.in",
            password_hash=get_password_hash("viit@admin123"),
            role="admin",
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        
        print("✅ VIIT admin user created successfully!")
        print("=" * 50)
        print("VIIT Admin Credentials:")
        print("  Email: admin@viit.ac.in")
        print("  Password: viit@admin123")
        print("=" * 50)
        print("\n[NEXT] Run seed_data.py to populate the database")
        print("   python seed_data.py")
        
    except Exception as e:
        print(f"[ERROR] Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_initial_admin()

