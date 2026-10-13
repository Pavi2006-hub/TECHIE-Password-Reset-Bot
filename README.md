# TECHIE — Password Reset Walkthrough Bot
Complete Full-Stack Application: React + Vite + TypeScript + FastAPI + SQLite + SMTP

TECHIE is an academic cybersecurity engineering project demonstrating a guided, attack-resilient password recovery walkthrough bot featuring:
- **Zero plain credential leaks**: OTPs and authorization tokens are HMAC/SHA256 verified; passwords hashed with **Argon2id**.
- **Anti-enumeration defenses**: Uniform, generic recovery responses for known and unknown accounts.
- **Throttling & Single-Use Tokens**: 5-minute expiration, max 5 verification attempts per challenge, atomic token consumption.
- **Configurable SMTP Delivery**: Zero-cost local testing with Mailpit (`127.0.0.1:1025`) or cloud transactional SMTP (SendGrid, Mailgun, Postmark, AWS SES) with STARTTLS and authentication.
- **Security Audit Ledger**: Masked account identifiers, granular event categories, correlated request IDs, and protected administrator access with password reveal toggles.

---

## 1. Production Deployment Guide

### Deployment Architecture
- **Frontend**: Deploy to **Vercel**, **Netlify**, or **Cloudflare Pages**.
- **Backend**: Deploy to **Render**, **Railway**, **Fly.io**, or any Docker-compatible PaaS.
- **Database**: SQLite with persistent disk storage (or PostgreSQL using SQLAlchemy for multi-instance clusters).
- **Email Delivery**: Transactional SMTP provider (SendGrid, Mailgun, AWS SES, Brevo) with TLS.

---

### Step A: Deploying Backend (e.g., Render / Railway / Docker)

1. **Root Directory**: Deploy from the `backend/` directory or use the provided [Dockerfile](file:///C:/Users/pavik/.gemini/antigravity/scratch/techie-password-reset/backend/Dockerfile).
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   | Variable | Value / Description | Example |
   | :--- | :--- | :--- |
   | `APP_ENV` | Environment identifier | `production` |
   | `PORT` | Auto-assigned by host | `8000` |
   | `FRONTEND_ORIGINS` | Comma-separated allowed frontend origins for CORS | `https://techie-app.vercel.app` |
   | `DATABASE_PATH` | Path to persistent SQLite database | `/var/data/techie.db` |
   | `SECRET_KEY` | 64-char random cryptographic signing secret | `python -c "import secrets; print(secrets.token_hex(32))"` |
   | `ADMIN_USERNAME` | Strong administrator username | `sysadmin` |
   | `ADMIN_PASSWORD` | Strong administrator password | `ComplexAdminPass2026!` |
   | `SMTP_HOST` | Production SMTP host | `smtp.sendgrid.net` |
   | `SMTP_PORT` | Production SMTP port | `587` |
   | `SMTP_USERNAME` | SMTP API key/user | `apikey` |
   | `SMTP_PASSWORD` | SMTP password | `SG.xxxxxxxxxxxx` |
   | `SMTP_USE_TLS` | Enable STARTTLS | `true` |
   | `SMTP_FROM_EMAIL` | Verified sender address | `security@yourdomain.com` |

---

### Step B: Deploying Frontend (e.g., Vercel / Netlify)

1. **Root Directory**: `frontend/`
2. **Build Command**: `npm run build`
3. **Output Directory**: `dist`
4. **Environment Variable**:
   | Variable | Value / Description | Example |
   | :--- | :--- | :--- |
   | `VITE_API_BASE_URL` | Public URL of your deployed backend | `https://techie-api.onrender.com` |

---

## 2. Local Development & Testing Instructions (Windows)

Local development runs entirely with zero cost and zero external accounts.

### 1. Start Local Mailpit SMTP Server
```powershell
cd C:\Users\pavik\.gemini\antigravity\scratch\tools
.\mailpit.exe --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025
```
- **SMTP Server**: `127.0.0.1:1025`
- **Web Mailbox**: [http://localhost:8025](http://localhost:8025)

---

### 2. Start FastAPI Backend Server
```powershell
cd C:\Users\pavik\.gemini\antigravity\scratch\techie-password-reset\backend
.\venv\Scripts\Activate.ps1

# Seed mock demo accounts
python ..\scripts\seed_demo_users.py

# Run development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- **API URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 3. Start React Frontend
```powershell
cd C:\Users\pavik\.gemini\antigravity\scratch\techie-password-reset\frontend
npm run dev -- --host 127.0.0.1 --port 5173
```
- **Web App**: [http://localhost:5173](http://localhost:5173)

---

## 3. Demo Accounts & Admin Credentials

### Mock Users (Pre-seeded for local tests)
- `student@example.test` (Initial Password: `DemoPassword123!`)
- `faculty@example.test` (Initial Password: `DemoPassword456!`)
- `admin@example.test` (Initial Password: `DemoAdminPassword789!`)

### Administrator Audit Login
- **Username**: Configured via `ADMIN_USERNAME` (Local default: `admin`)
- **Password**: Configured via `ADMIN_PASSWORD` (Local default: `TechieAdmin2026!`)

---

## 4. Automated Verification Results

All 12 backend regression tests passed cleanly:
```text
tests/test_audit.py::test_audit_summary_unauthorized PASSED              [  8%]
tests/test_audit.py::test_audit_summary_authorized PASSED                [ 16%]
tests/test_audit.py::test_audit_logs_pagination_and_masking PASSED       [ 25%]
tests/test_auth.py::test_request_reset_known_user PASSED                 [ 33%]
tests/test_auth.py::test_request_reset_unknown_user_generic_response PASSED [ 41%]
tests/test_auth.py::test_verify_otp_success_and_password_reset PASSED    [ 50%]
tests/test_auth.py::test_verify_otp_invalid_code PASSED                  [ 58%]
tests/test_auth.py::test_verify_otp_expired PASSED                       [ 66%]
tests/test_auth.py::test_verify_otp_attempt_limit_exceeded PASSED        [ 75%]
tests/test_auth.py::test_audit_logging_recorded PASSED                   [ 83%]
tests/test_health.py::test_health_check_endpoint PASSED                  [ 91%]
tests/test_health.py::test_root_endpoint PASSED                          [100%]
======================== 12 passed, 1 warning in 1.51s ========================
```
Frontend build (`npm run build`) produced 0 errors.

---

## 5. Security & Persistence Review for Production
1. **Database Persistence**: SQLite stores data in a local file. On ephemeral PaaS hosting (such as standard free Render/Heroku dynos), files reset on each redeploy. For public production, mount a persistent volume (e.g., Render Disk) or migrate to a managed PostgreSQL database.
2. **Secrets Storage**: All passwords, API keys, and signing keys are read exclusively from environment variables and excluded from git via `.gitignore`.
3. **Audit Protection**: Public users cannot view audit logs; all queries are gated behind `verify_admin` with constant-time credential comparison.
