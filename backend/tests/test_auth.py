import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db_connection
from app.security import compute_otp_verifier, verify_password

client = TestClient(app)

def test_request_reset_known_user(monkeypatch):
    # Mock SMTP to avoid network calls during test
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    response = client.post("/api/auth/request-reset", json={"email": "student@example.test"})
    assert response.status_code == 200
    data = response.json()
    assert "dispatched" in data["message"]
    assert data["challenge_id"] is not None
    assert data["request_id"] is not None

def test_request_reset_unknown_user_generic_response(monkeypatch):
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    response = client.post("/api/auth/request-reset", json={"email": "unknown_random_person@example.test"})
    assert response.status_code == 200
    data = response.json()
    # Must return same generic message to prevent account enumeration
    assert "dispatched" in data["message"]
    assert data["challenge_id"] is not None

def test_verify_otp_success_and_password_reset(monkeypatch):
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    # 1. Request reset
    req_resp = client.post("/api/auth/request-reset", json={"email": "student@example.test"})
    challenge_id = req_resp.json()["challenge_id"]

    # 2. Injected known OTP for the challenge
    known_otp = "123456"
    new_verifier = compute_otp_verifier(challenge_id, known_otp)
    with get_db_connection() as conn:
        conn.execute("UPDATE otp_challenges SET otp_verifier = ? WHERE id = ?", (new_verifier, challenge_id))
        conn.commit()

    # 3. Verify OTP
    verify_resp = client.post("/api/auth/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": known_otp
    })
    assert verify_resp.status_code == 200
    reset_token = verify_resp.json()["reset_token"]
    assert reset_token is not None

    # 4. Reset password
    new_password = "NewSecurePassword2026!"
    reset_resp = client.post("/api/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": new_password
    })
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"

    # 5. Verify database password hash was updated
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password_hash FROM users WHERE email = ?", ("student@example.test",))
        row = cursor.fetchone()
        assert verify_password(row["password_hash"], new_password) is True

    # 6. Reusing consumed reset token must fail
    reuse_resp = client.post("/api/auth/reset-password", json={
        "reset_token": reset_token,
        "new_password": "AnotherPassword2026!"
    })
    assert reuse_resp.status_code == 400

def test_verify_otp_invalid_code(monkeypatch):
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    req_resp = client.post("/api/auth/request-reset", json={"email": "faculty@example.test"})
    challenge_id = req_resp.json()["challenge_id"]

    # Supply wrong OTP
    resp = client.post("/api/auth/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": "000000"
    })
    assert resp.status_code == 400
    assert "Incorrect verification code" in resp.json()["detail"]

def test_verify_otp_expired(monkeypatch):
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    req_resp = client.post("/api/auth/request-reset", json={"email": "faculty@example.test"})
    challenge_id = req_resp.json()["challenge_id"]

    # Set expiry to past
    past_iso = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
    with get_db_connection() as conn:
        conn.execute("UPDATE otp_challenges SET expires_at = ? WHERE id = ?", (past_iso, challenge_id))
        conn.commit()

    resp = client.post("/api/auth/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": "123456"
    })
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()

def test_verify_otp_attempt_limit_exceeded(monkeypatch):
    monkeypatch.setattr("app.routers.auth.send_otp_email", lambda email, otp: True)

    req_resp = client.post("/api/auth/request-reset", json={"email": "faculty@example.test"})
    challenge_id = req_resp.json()["challenge_id"]

    # Attempt 5 incorrect times
    for _ in range(5):
        client.post("/api/auth/verify-otp", json={
            "challenge_id": challenge_id,
            "otp": "999999"
        })

    # 6th attempt should be blocked with 429
    blocked_resp = client.post("/api/auth/verify-otp", json={
        "challenge_id": challenge_id,
        "otp": "999999"
    })
    assert blocked_resp.status_code == 429

def test_audit_logging_recorded():
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as cnt FROM audit_logs")
        count = cursor.fetchone()["cnt"]
        assert count > 0
