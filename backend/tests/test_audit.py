from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ADMIN_AUTH = ("admin", "TechieAdmin2026!")

def test_audit_summary_unauthorized():
    res = client.get("/api/audit-logs/summary")
    assert res.status_code == 401

def test_audit_summary_authorized():
    res = client.get("/api/audit-logs/summary", auth=ADMIN_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert "total_events" in data
    assert "successful_resets" in data
    assert "failed_attempts" in data

def test_audit_logs_pagination_and_masking():
    res = client.get("/api/audit-logs?limit=10&offset=0", auth=ADMIN_AUTH)
    assert res.status_code == 200
    data = res.json()
    assert "logs" in data
    assert "total" in data

    for log in data["logs"]:
        # Verify no plain secrets
        assert "password" not in log["safe_metadata"] if log["safe_metadata"] else True
        assert "otp" not in log["safe_metadata"] if log["safe_metadata"] else True
        # Verify email is masked or N/A
        if log["masked_email"] != "N/A":
            assert "***" in log["masked_email"]
