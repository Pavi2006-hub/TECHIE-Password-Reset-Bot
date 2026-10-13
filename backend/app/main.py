from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import health, auth, audit

# Initialize database schema on startup
init_db()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="TECHIE Password Reset Walkthrough Bot API"
)

# Configure CORS dynamically based on allowed origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(audit.router)

@app.get("/")
def root():
    return {
        "message": "TECHIE Password Reset Walkthrough API is running",
        "health_check": "/api/health",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=(settings.app_env == "development"))
