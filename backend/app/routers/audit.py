from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
import secrets
from app.database import get_db_connection
from app.config import settings

router = APIRouter(prefix="/api/audit-logs", tags=["Audit & Security Logs"])
security = HTTPBasic()

def verify_admin(credentials: HTTPBasicCredentials = Depends(security)):
    is_user_ok = secrets.compare_digest(credentials.username, settings.admin_username)
    is_pass_ok = secrets.compare_digest(credentials.password, settings.admin_password)
    if not (is_user_ok and is_pass_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid administrator credentials.",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@router.get("/summary")
def get_audit_summary(admin: str = Depends(verify_admin)):
    """
    Returns aggregate security statistics.
    Protected by basic admin authentication.
    """
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM audit_logs")
        total_events = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'RESET_REQUESTED'")
        total_requests = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'PASSWORD_RESET_SUCCEEDED'")
        successful_resets = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'OTP_VERIFICATION_FAILED'")
        failed_attempts = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(*) FROM audit_logs WHERE event_type = 'OTP_EXPIRED'")
        expired_challenges = cursor.fetchone()[0]

        return {
            "total_events": total_events,
            "total_requests": total_requests,
            "successful_resets": successful_resets,
            "failed_attempts": failed_attempts,
            "expired_challenges": expired_challenges,
        }

@router.get("")
def get_audit_logs(
    admin: str = Depends(verify_admin),
    event_type: str | None = Query(None),
    outcome: str | None = Query(None),
    request_id: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0)
):
    """
    Retrieves filtered, paginated security audit records.
    All email addresses are masked and secret tokens are excluded.
    """
    query = """
        SELECT id, event_id, request_id, masked_email, event_type, outcome, timestamp, safe_metadata
        FROM audit_logs
        WHERE 1=1
    """
    params = []

    if event_type:
        query += " AND event_type = ?"
        params.append(event_type)
    if outcome:
        query += " AND outcome = ?"
        params.append(outcome)
    if request_id:
        query += " AND request_id LIKE ?"
        params.append(f"%{request_id}%")

    query += " ORDER BY id DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        
        # Get total matching count
        count_query = "SELECT COUNT(*) FROM audit_logs WHERE 1=1"
        count_params = []
        if event_type:
            count_query += " AND event_type = ?"
            count_params.append(event_type)
        if outcome:
            count_query += " AND outcome = ?"
            count_params.append(outcome)
        if request_id:
            count_query += " AND request_id LIKE ?"
            count_params.append(f"%{request_id}%")

        cursor.execute(count_query, count_params)
        total_matching = cursor.fetchone()[0]

        logs = [
            {
                "id": r["id"],
                "event_id": r["event_id"],
                "request_id": r["request_id"],
                "masked_email": r["masked_email"] or "N/A",
                "event_type": r["event_type"],
                "outcome": r["outcome"],
                "timestamp": r["timestamp"],
                "safe_metadata": r["safe_metadata"]
            }
            for r in rows
        ]

        return {
            "total": total_matching,
            "limit": limit,
            "offset": offset,
            "logs": logs
        }
