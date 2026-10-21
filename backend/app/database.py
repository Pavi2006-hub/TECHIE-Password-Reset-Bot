import sqlite3
import os
from contextlib import contextmanager
from app.config import settings

def get_db_path() -> str:
    db_path = settings.database_path
    os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
    return db_path

@contextmanager
def get_db_connection():
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")

        # 2. OTP Challenges table (with request_id correlation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS otp_challenges (
                id TEXT PRIMARY KEY,
                request_id TEXT,
                user_id INTEGER,
                email TEXT NOT NULL,
                otp_verifier TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 5,
                consumed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_challenges(email);")

        # Add column if upgrading existing table
        try:
            cursor.execute("ALTER TABLE otp_challenges ADD COLUMN request_id TEXT;")
        except sqlite3.OperationalError:
            pass

        # 3. Password Reset Authorizations table (with request_id correlation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_authorizations (
                id TEXT PRIMARY KEY,
                request_id TEXT,
                token_hash TEXT UNIQUE NOT NULL,
                user_id INTEGER NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                consumed_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_token_hash ON password_reset_authorizations(token_hash);")

        try:
            cursor.execute("ALTER TABLE password_reset_authorizations ADD COLUMN request_id TEXT;")
        except sqlite3.OperationalError:
            pass

        # 4. Audit Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT UNIQUE NOT NULL,
                request_id TEXT,
                user_id INTEGER,
                masked_email TEXT,
                event_type TEXT NOT NULL,
                outcome TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                safe_metadata TEXT
            );
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_audit_request ON audit_logs(request_id);")

        conn.commit()

        # Seed initial demo accounts if not already present
        from app.security import hash_password
        from app.config import settings

        accounts_to_seed = []
        for item in settings.demo_accounts_raw.split(","):
            if ":" in item:
                acc_email, acc_pwd = item.split(":", 1)
                if acc_email.strip():
                    accounts_to_seed.append((acc_email.strip().lower(), acc_pwd.strip()))

        for email, initial_pwd in accounts_to_seed:
            cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO users (email, password_hash)
                    VALUES (?, ?)
                    ON CONFLICT(email) DO NOTHING;
                """, (email, hash_password(initial_pwd)))
        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
