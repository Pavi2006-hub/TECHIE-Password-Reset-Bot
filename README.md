# TECHIE — Secure Password Recovery Assistant

[![Frontend Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel&style=flat)](https://techie-password-reset-bot.vercel.app/)
[![Backend Deployment](https://img.shields.io/badge/Render-Online-success?logo=render&style=flat)](https://techie-password-reset-bot-1.onrender.com/api/health)
[![GitHub Repository](https://img.shields.io/badge/GitHub-Repository-181717?logo=github&style=flat)](https://github.com/Pavi2006-hub/TECHIE-Password-Reset-Bot)
[![Tests Passing](https://img.shields.io/badge/pytest-21%20passed-brightgreen?logo=pytest&style=flat)](https://github.com/Pavi2006-hub/TECHIE-Password-Reset-Bot)

**TECHIE** is a full-stack cybersecurity engineering project implementing an attack-resilient, automated password recovery walkthrough bot. Rather than relying on traditional static reset links that are vulnerable to token interception and phishing, TECHIE delivers an interactive, guided identity-verification experience backed by zero-trust architecture.

---

## 🚀 Live Deployments

| Component | Platform | Live URL |
| :--- | :--- | :--- |
| **Frontend Application** | **Vercel** | [https://techie-password-reset-bot.vercel.app/](https://techie-password-reset-bot.vercel.app/) |
| **FastAPI Backend Service** | **Render** | [https://techie-password-reset-bot-1.onrender.com/](https://techie-password-reset-bot-1.onrender.com/) |
| **Backend Health Check** | **Render** | [https://techie-password-reset-bot-1.onrender.com/api/health](https://techie-password-reset-bot-1.onrender.com/api/health) |
| **Audit Logs Dashboard** | **Vercel** | [https://techie-password-reset-bot.vercel.app/#audit](https://techie-password-reset-bot.vercel.app/) *(Click "Audit Logs" in header)* |
| **Source Code** | **GitHub** | [https://github.com/Pavi2006-hub/TECHIE-Password-Reset-Bot](https://github.com/Pavi2006-hub/TECHIE-Password-Reset-Bot) |

---

## 👥 Authorized User Dataset

To prevent unauthorized password resets and enforce access control, the system is strictly limited to an authorized dataset. **Only the following 6 email addresses have access to request password recovery:**

1. `pavikumar086@gmail.com`
2. `knarmatha730@gmail.com`
3. `2510priyakumar@gmail.com`
4. `ramyaramya63444@gmail.com`
5. `pavatharini98420@gmail.com`
6. `thra682006@gmail.com`

> **Access Control Rule:** If any email address **not** in this dataset is submitted, the system denies access immediately with `HTTP 404`:
> ```text
> "The given email ID is not in the dataset. Access denied."
> ```
> An `UNAUTHORIZED_ACCESS_ATTEMPT` event is logged in the audit ledger, and no OTP is generated or sent.

---

## 🛡️ Core Security Architecture

* **Argon2id Password Hashing**: State-of-the-art hybrid memory-hard hashing (`argon2-cffi`) preventing GPU-accelerated and side-channel cracking.
* **Keyed HMAC-SHA256 OTP Verifier**: Plaintext OTPs are **never** stored in the database. Challenges store a cryptographically keyed HMAC verifier using a secret signing key.
* **Strict Expiration & Rate-Limiting**:
  * Passcodes expire automatically after **5 minutes**.
  * A maximum of **5 incorrect attempts** is enforced before the challenge is permanently invalidated (`HTTP 429`).
* **Single-Use Reset Authorization Tokens**: Once the OTP is verified, an ephemeral, single-use reset authorization token is issued. It is consumed atomically upon password update; token replay returns `HTTP 400`.
* **Transactional SMTP Relay**: Live delivery to Gmail inboxes through **Brevo (Sendinblue)** using STARTTLS on port `587` (with automatic fallback to port `2525`). Local development uses **Mailpit** on port `1025`.
* **Privacy-Preserving Audit Logs**: Admin dashboard displays real-time security events with masked email addresses (e.g., `p***6@gmail.com`). Plaintext passwords, tokens, and OTPs are strictly excluded from logs.
* **Protected Admin Access**: Access to `/api/audit-logs` requires HTTP Basic Authentication with constant-time string comparison (`secrets.compare_digest`) to prevent timing attacks.

---

## 🛠️ Technology Stack

| Layer | Tools & Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, CSS3 (Dark Galaxy Theme), Lucide Icons |
| **Backend** | Python 3.13, FastAPI, Uvicorn (ASGI), Pydantic Schemas |
| **Security & Crypto** | Argon2id (`argon2-cffi`), HMAC-SHA256, Python `secrets`, `hashlib`, `uuid` |
| **Database** | SQLite3 (Persistent relational tables: users, challenges, authorizations, audit logs) |
| **Email Protocol** | Python `smtplib`, MIME multipart (HTML & plain-text templates) |
| **Production Email** | Brevo SMTP Relay (`smtp-relay.brevo.com:587`) |
| **Testing** | Pytest, AnyIO, Starlette `TestClient` (21 passing regression tests) |
| **Cloud Hosting** | Vercel (Frontend edge), Render (Backend container) |

---

## ⚙️ Environment Configuration

### Backend Environment Variables (`backend/.env` / Render Dashboard)

| Variable | Description | Production Value |
| :--- | :--- | :--- |
| `APP_ENV` | Application environment | `production` |
| `HOST` | Bind host address | `0.0.0.0` |
| `PORT` | Web service port | `8000` (auto-assigned by Render) |
| `FRONTEND_ORIGINS` | CORS authorized frontend URLs | `https://techie-password-reset-bot.vercel.app` |
| `DATABASE_PATH` | Path to SQLite database file | `./data/techie.db` |
| `SECRET_KEY` | Cryptographic secret for HMAC generation | *(Random 64-character secret key)* |
| `ADMIN_USERNAME` | Administrator username for Audit Dashboard | `admin` |
| `ADMIN_PASSWORD` | Administrator password for Audit Dashboard | `TechieAdmin2026!` |
| `SMTP_HOST` | Transactional SMTP server hostname | `smtp-relay.brevo.com` |
| `SMTP_PORT` | Transactional SMTP port | `587` |
| `SMTP_USE_TLS` | Enable STARTTLS encryption | `true` |
| `SMTP_USERNAME` | Brevo SMTP Login identifier | *(Your Brevo SMTP Login)* |
| `SMTP_PASSWORD` | Brevo Master SMTP Key | `xsmtpsib-...` |
| `SMTP_FROM_EMAIL` | Verified sender email address | `pavikumar086@gmail.com` |
| `DEMO_ACCOUNTS` | Authorized dataset seeded on initialization | `pavikumar086@gmail.com:TechieUserPass2026!,...` |

### Frontend Environment Variables (`frontend/.env` / Vercel Dashboard)

| Variable | Description | Production Value |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Public URL of deployed FastAPI backend | `https://techie-password-reset-bot-1.onrender.com` |

---

## 💻 Local Development Setup (Windows)

Local development runs with zero cost using Mailpit for local inbox testing.

### 1. Start Local Mailpit SMTP Server
```powershell
# In tools/ folder
.\mailpit.exe --smtp 127.0.0.1:1025 --listen 127.0.0.1:8025
```
* **SMTP Server**: `127.0.0.1:1025`
* **Web Inbox**: [http://localhost:8025](http://localhost:8025)

### 2. Start FastAPI Backend
```powershell
cd backend
.\venv\Scripts\activate
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Endpoint**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
* **Swagger Interactive Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Start React Frontend
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
* **Web UI**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Automated Testing

Run the full automated test suite covering all authentication flows, dataset authorization checks, rate-limiting, and audit event tracking:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

### Verified Test Results:
```text
tests/test_audit.py::test_audit_summary_unauthorized PASSED              [  4%]
tests/test_audit.py::test_audit_summary_authorized PASSED                [  9%]
tests/test_audit.py::test_audit_logs_pagination_and_masking PASSED       [ 14%]
tests/test_auth.py::test_request_reset_known_user PASSED                 [ 19%]
tests/test_auth.py::test_request_reset_smtp_failure_logs_audit PASSED    [ 23%]
tests/test_auth.py::test_resend_otp_success PASSED                       [ 28%]
tests/test_auth.py::test_resend_otp_smtp_failure_logs_audit PASSED       [ 33%]
tests/test_auth.py::test_request_reset_unknown_user_rejected PASSED      [ 38%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[pavikumar086@gmail.com] PASSED [ 42%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[knarmatha730@gmail.com] PASSED [ 47%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[2510priyakumar@gmail.com] PASSED [ 52%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[ramyaramya63444@gmail.com] PASSED [ 57%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[pavatharini98420@gmail.com] PASSED [ 61%]
tests/test_auth.py::test_request_reset_authorized_dataset_emails[thra682006@gmail.com] PASSED [ 66%]
tests/test_auth.py::test_verify_otp_success_and_password_reset PASSED    [ 71%]
tests/test_auth.py::test_verify_otp_invalid_code PASSED                  [ 76%]
tests/test_auth.py::test_verify_otp_expired PASSED                       [ 80%]
tests/test_auth.py::test_verify_otp_attempt_limit_exceeded PASSED        [ 85%]
tests/test_auth.py::test_audit_logging_recorded PASSED                   [ 90%]
tests/test_health.py::test_health_check_endpoint PASSED                  [ 95%]
tests/test_health.py::test_root_endpoint PASSED                          [100%]

======================== 21 passed in 1.60s ========================
```

---

## 🔒 Security Audit Ledger Event Types

The application logs security audit events in real time to the SQLite ledger:

| Event Type | Outcome | Trigger Condition |
| :--- | :--- | :--- |
| `RESET_REQUESTED` | `SUCCESS` | Authorized account requested a password recovery passcode. |
| `UNAUTHORIZED_ACCESS_ATTEMPT` | `FAILED` | Email address outside the authorized dataset attempted recovery. |
| `OTP_SENT` | `SUCCESS` | Passcode dispatched via SMTP relay to recipient inbox. |
| `OTP_SEND_FAILED` | `FAILED` | SMTP connection, authentication, or delivery error encountered. |
| `OTP_RESENT` | `SUCCESS` | User requested a fresh passcode replacement. |
| `OTP_VERIFICATION_SUCCEEDED` | `SUCCESS` | Valid 6-digit OTP code supplied within 5-minute window. |
| `OTP_VERIFICATION_FAILED` | `FAILED` | Invalid OTP code entered (decrements remaining attempt counter). |
| `OTP_EXPIRED` | `FAILED` | Passcode verification attempted after the 5-minute expiry. |
| `PASSWORD_RESET_SUCCEEDED` | `SUCCESS` | New Argon2id password hash established; reset token consumed. |

---

## 📄 License & Attribution

Developed as an academic final-year cybersecurity engineering project demonstrating secure identity recovery and attack-resistant authentication workflows.
