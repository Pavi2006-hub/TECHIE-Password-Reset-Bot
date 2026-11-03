import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    app_name: str = "TECHIE — Password Reset Walkthrough Bot"
    app_version: str = "1.0.0"
    app_env: str = os.getenv("APP_ENV", "development")
    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "8000"))
    
    # CORS: Allow configurable origins, falling back to local dev ports
    frontend_origins_raw: str = os.getenv("FRONTEND_ORIGINS", os.getenv("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173"))

    @property
    def allowed_origins(self) -> list[str]:
        return [orig.strip() for orig in self.frontend_origins_raw.split(",") if orig.strip()]

    # Database & Demo Users
    database_path: str = os.getenv("DATABASE_PATH", "./data/techie.db")
    demo_accounts_raw: str = os.getenv(
        "DEMO_ACCOUNTS",
        "pavikumar086@gmail.com:InitialStudentPassword2026!,student@example.test:DemoPassword123!,faculty@example.test:DemoPassword456!,admin@example.test:DemoAdminPassword789!"
    )

    # Detect if running in cloud hosting (Render / Cloud environment)
    is_cloud: bool = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID") or os.getenv("PORT"))

    # Production vs Local SMTP Configuration
    smtp_host: str = os.getenv("SMTP_HOST", "smtp-relay.brevo.com" if is_cloud else "127.0.0.1")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587" if is_cloud else "1025"))
    smtp_username: str | None = os.getenv("SMTP_USERNAME", None)
    smtp_password: str | None = os.getenv("SMTP_PASSWORD", None)
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true" if is_cloud else "false").lower() in ("true", "1", "yes")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", "pavikumar086@gmail.com")

    # Cryptographic Signing Key
    secret_key: str = os.getenv("SECRET_KEY", "techie-academic-demo-secret-key-change-in-prod")

    # Protected Administrator Credentials
    admin_username: str = os.getenv("ADMIN_USERNAME", "admin")
    admin_password: str = os.getenv("ADMIN_PASSWORD", "TechieAdmin2026!")

settings = Settings()
