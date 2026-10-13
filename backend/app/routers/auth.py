import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, status
from app.database import get_db_connection
from app.schemas import (
    RequestResetInput, GenericResponse,
    VerifyOtpInput, VerifyOtpResponse,
    ResetPasswordInput, ResendOtpInput
)
from app.security import (
    generate_otp, compute_otp_verifier, verify_otp_match,
    generate_token_pair, hash_token, hash_password, mask_email
)
from app.email_service import send_otp_email
from app.audit_service import record_audit_event

router = APIRouter(prefix="/api/auth", tags=["Authentication & Password Recovery"])

OTP_EXPIRY_MINUTES = 5
RESET_TOKEN_EXPIRY_MINUTES = 10
MAX_ATTEMPTS = 5

@router.post("/request-reset", response_model=GenericResponse)
def request_password_reset(payload: RequestResetInput):
    """
    Request password reset OTP for the given email.
    Returns a generic response to prevent account enumeration.
    """
    email_clean = payload.email.strip().lower()
    request_id = str(uuid.uuid4())
    masked = mask_email(email_clean)

    record_audit_event(
        event_type="RESET_REQUESTED",
        outcome="SUCCESS",
        request_id=request_id,
        masked_email=masked
    )

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email_clean,))
        user_row = cursor.fetchone()

        if not user_row:
            fake_challenge_id = str(uuid.uuid4())
            return {
                "message": "If an account exists with this email, a verification passcode has been dispatched.",
                "challenge_id": fake_challenge_id,
                "request_id": request_id
            }

        user_id = user_row["id"]
        challenge_id = str(uuid.uuid4())
        otp = generate_otp()
        otp_verifier = compute_otp_verifier(challenge_id, otp)
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()

        # Invalidate existing pending challenges for this user/email
        cursor.execute("""
            UPDATE otp_challenges
            SET consumed_at = ?
            WHERE user_id = ? AND consumed_at IS NULL
        """, (datetime.now(timezone.utc).isoformat(), user_id))

        cursor.execute("""
            INSERT INTO otp_challenges (
                id, request_id, user_id, email, otp_verifier, expires_at, attempts, max_attempts
            ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
        """, (challenge_id, request_id, user_id, email_clean, otp_verifier, expires_at, MAX_ATTEMPTS))
        conn.commit()

    sent = send_otp_email(email_clean, otp)
    if sent:
        record_audit_event(
            event_type="OTP_SENT",
            outcome="SUCCESS",
            request_id=request_id,
            user_id=user_id,
            masked_email=masked
        )
    else:
        record_audit_event(
            event_type="OTP_SEND_FAILED",
            outcome="FAILED",
            request_id=request_id,
            user_id=user_id,
            masked_email=masked,
            metadata={"reason": "SMTP test server delivery failure"}
        )

    return {
        "message": "If an account exists with this email, a verification passcode has been dispatched.",
        "challenge_id": challenge_id,
        "request_id": request_id
    }

@router.post("/verify-otp", response_model=VerifyOtpResponse)
def verify_otp(payload: VerifyOtpInput):
    """
    Validate OTP against challenge.
    On success, generates a short-lived, single-use reset authorization token with correlation request_id.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    now_dt = datetime.now(timezone.utc)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, request_id, user_id, email, otp_verifier, expires_at, attempts, max_attempts, consumed_at
            FROM otp_challenges
            WHERE id = ?
        """, (payload.challenge_id,))
        challenge = cursor.fetchone()

        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired recovery challenge."
            )

        req_id = challenge["request_id"]

        if challenge["consumed_at"] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This recovery challenge has already been consumed."
            )

        # Check expiration
        expires_at_dt = datetime.fromisoformat(challenge["expires_at"])
        if now_dt > expires_at_dt:
            record_audit_event(
                event_type="OTP_EXPIRED",
                outcome="EXPIRED",
                request_id=req_id,
                user_id=challenge["user_id"],
                masked_email=mask_email(challenge["email"])
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The verification passcode has expired. Please request a new one."
            )

        # Check maximum attempts
        current_attempts = challenge["attempts"] + 1
        if current_attempts > challenge["max_attempts"]:
            cursor.execute("UPDATE otp_challenges SET consumed_at = ? WHERE id = ?", (now_iso, payload.challenge_id))
            conn.commit()
            record_audit_event(
                event_type="OTP_VERIFICATION_FAILED",
                outcome="BLOCKED",
                request_id=req_id,
                user_id=challenge["user_id"],
                masked_email=mask_email(challenge["email"]),
                metadata={"reason": "Max attempts exceeded"}
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Maximum verification attempts exceeded. Please initiate a new password reset."
            )

        # Verify OTP code
        is_valid = verify_otp_match(payload.challenge_id, payload.otp, challenge["otp_verifier"])

        if not is_valid:
            cursor.execute("UPDATE otp_challenges SET attempts = ? WHERE id = ?", (current_attempts, payload.challenge_id))
            conn.commit()
            record_audit_event(
                event_type="OTP_VERIFICATION_FAILED",
                outcome="FAILED",
                request_id=req_id,
                user_id=challenge["user_id"],
                masked_email=mask_email(challenge["email"]),
                metadata={"attempt": current_attempts, "max": challenge["max_attempts"]}
            )
            remaining = challenge["max_attempts"] - current_attempts
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Incorrect verification code. {remaining} attempt(s) remaining."
            )

        # Success: consume challenge atomically
        cursor.execute("UPDATE otp_challenges SET consumed_at = ?, attempts = ? WHERE id = ?",
                       (now_iso, current_attempts, payload.challenge_id))

        # Generate single-use reset authorization token correlating to request_id
        raw_token, token_hash = generate_token_pair()
        auth_id = str(uuid.uuid4())
        auth_expires_at = (now_dt + timedelta(minutes=RESET_TOKEN_EXPIRY_MINUTES)).isoformat()

        cursor.execute("""
            INSERT INTO password_reset_authorizations (
                id, request_id, token_hash, user_id, expires_at
            ) VALUES (?, ?, ?, ?, ?)
        """, (auth_id, req_id, token_hash, challenge["user_id"], auth_expires_at))
        conn.commit()

        record_audit_event(
            event_type="OTP_VERIFICATION_SUCCEEDED",
            outcome="SUCCESS",
            request_id=req_id,
            user_id=challenge["user_id"],
            masked_email=mask_email(challenge["email"])
        )

        return {
            "message": "OTP verified successfully. You may now establish a new password.",
            "reset_token": raw_token,
            "expires_in_seconds": RESET_TOKEN_EXPIRY_MINUTES * 60
        }

@router.post("/reset-password")
def reset_password(payload: ResetPasswordInput):
    """
    Apply password update using valid reset_token.
    Hashes password with Argon2id and consumes the token atomically.
    Correlates audit log with original request_id.
    """
    now_dt = datetime.now(timezone.utc)
    token_hash = hash_token(payload.reset_token)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, request_id, user_id, expires_at, consumed_at
            FROM password_reset_authorizations
            WHERE token_hash = ?
        """, (token_hash,))
        auth_row = cursor.fetchone()

        if not auth_row:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or unrecognized password reset authorization token."
            )

        req_id = auth_row["request_id"]

        if auth_row["consumed_at"] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This reset token has already been consumed."
            )

        expires_at_dt = datetime.fromisoformat(auth_row["expires_at"])
        if now_dt > expires_at_dt:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset authorization has expired. Please initiate a new recovery request."
            )

        # Enforce password complexity
        password = payload.new_password
        if len(password) < 8 or not any(c.isupper() for c in password) or not any(c.isdigit() for c in password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 8 characters long and include an uppercase letter and a number."
            )

        # Hash with Argon2id
        new_hash = hash_password(password)
        now_iso = now_dt.isoformat()

        # Atomic transaction: Update user password and consume authorization token
        cursor.execute("""
            UPDATE users
            SET password_hash = ?, updated_at = ?
            WHERE id = ?
        """, (new_hash, now_iso, auth_row["user_id"]))

        cursor.execute("""
            UPDATE password_reset_authorizations
            SET consumed_at = ?
            WHERE id = ?
        """, (now_iso, auth_row["id"]))

        conn.commit()

        # Fetch email for audit masking
        cursor.execute("SELECT email FROM users WHERE id = ?", (auth_row["user_id"],))
        user = cursor.fetchone()
        masked = mask_email(user["email"]) if user else None

        record_audit_event(
            event_type="PASSWORD_RESET_SUCCEEDED",
            outcome="SUCCESS",
            request_id=req_id,
            user_id=auth_row["user_id"],
            masked_email=masked
        )

        return {
            "status": "success",
            "message": "Password updated successfully. You can now log in with your new credentials."
        }

@router.post("/resend-otp", response_model=GenericResponse)
def resend_otp(payload: ResendOtpInput):
    """
    Resend a fresh OTP for an existing active challenge with request correlation.
    """
    now_dt = datetime.now(timezone.utc)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, request_id, user_id, email, expires_at, consumed_at
            FROM otp_challenges
            WHERE id = ?
        """, (payload.challenge_id,))
        challenge = cursor.fetchone()

        if not challenge or challenge["consumed_at"] is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired challenge reference."
            )

        new_otp = generate_otp()
        new_verifier = compute_otp_verifier(payload.challenge_id, new_otp)
        new_expires_at = (now_dt + timedelta(minutes=OTP_EXPIRY_MINUTES)).isoformat()
        req_id = challenge["request_id"] or str(uuid.uuid4())

        cursor.execute("""
            UPDATE otp_challenges
            SET otp_verifier = ?, expires_at = ?, attempts = 0
            WHERE id = ?
        """, (new_verifier, new_expires_at, payload.challenge_id))
        conn.commit()

    send_otp_email(challenge["email"], new_otp)

    record_audit_event(
        event_type="OTP_RESENT",
        outcome="SUCCESS",
        request_id=req_id,
        user_id=challenge["user_id"],
        masked_email=mask_email(challenge["email"])
    )

    return {
        "message": "A new verification code has been dispatched.",
        "challenge_id": payload.challenge_id,
        "request_id": req_id
    }
