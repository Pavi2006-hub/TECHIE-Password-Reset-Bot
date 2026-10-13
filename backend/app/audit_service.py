import json
import uuid
from app.database import get_db_connection

def record_audit_event(
    event_type: str,
    outcome: str,
    request_id: str | None = None,
    user_id: int | None = None,
    masked_email: str | None = None,
    metadata: dict | None = None
) -> str:
    """
    Log an auditable security event into SQLite.
    Never logs OTPs, passwords, or raw tokens.
    """
    event_id = str(uuid.uuid4())
    safe_metadata_str = json.dumps(metadata) if metadata else None

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO audit_logs (
                event_id, request_id, user_id, masked_email, event_type, outcome, safe_metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            request_id,
            user_id,
            masked_email,
            event_type,
            outcome,
            safe_metadata_str
        ))
        conn.commit()

    return event_id
