from datetime import datetime, timezone
from fastapi import APIRouter
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api", tags=["Health"])

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    timestamp: str

@router.get("/health", response_model=HealthResponse)
def get_health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.app_env,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
