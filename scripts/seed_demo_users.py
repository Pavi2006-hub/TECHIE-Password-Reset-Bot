import os
import sys

# Ensure backend package is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database import init_db, get_db_connection
from app.security import hash_password

DEMO_USERS = [
    {
        "email": "student@example.test",
        "initial_password": "DemoPassword123!"
    },
    {
        "email": "faculty@example.test",
        "initial_password": "DemoPassword456!"
    },
    {
        "email": "admin@example.test",
        "initial_password": "DemoAdminPassword789!"
    }
]

def seed():
    init_db()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        print("Seeding demo accounts into SQLite database...")
        for user in DEMO_USERS:
            pwd_hash = hash_password(user["initial_password"])
            cursor.execute("""
                INSERT INTO users (email, password_hash)
                VALUES (?, ?)
                ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash;
            """, (user["email"], pwd_hash))
            print(f"  [OK] Seeded demo user: {user['email']} (Initial: {user['initial_password']})")
        conn.commit()
    print("Demo accounts seeding complete.")

if __name__ == "__main__":
    seed()
