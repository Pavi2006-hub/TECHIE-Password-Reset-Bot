import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

def send_otp_email(recipient_email: str, otp_code: str) -> tuple[bool, str]:
    """
    Sends the 6-digit OTP code to recipient_email via configured SMTP.
    Supports local Mailpit (plaintext) or production SMTP (STARTTLS & Authentication).
    Does NOT log the OTP or secret credentials.
    Returns (success: bool, status_message: str).
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "TECHIE: Your Password Reset Verification Code"
    msg["From"] = settings.smtp_from_email
    msg["To"] = recipient_email

    text_body = f"""Hello,

You requested a password reset for your TECHIE account.
Your 6-digit verification code is: {otp_code}

This code expires in 5 minutes.
If you did not request this code, you can safely ignore this email.

— TECHIE Security System
"""

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07070D; color: #F2F0F8; padding: 24px; }}
        .card {{ background: #12111C; border: 1px solid rgba(139,120,198,0.3); border-radius: 12px; padding: 28px; max-width: 480px; margin: 0 auto; }}
        .brand {{ color: #8B78C6; font-size: 1.3rem; font-weight: bold; letter-spacing: 0.05em; margin-bottom: 16px; }}
        .code {{ font-size: 2.2rem; font-weight: bold; letter-spacing: 6px; color: #8B78C6; background: rgba(139,120,198,0.12); padding: 14px 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-family: monospace; border: 1px dashed rgba(139,120,198,0.4); }}
        .footer {{ color: #AAA5BC; font-size: 0.85rem; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">TECHIE · Secure Password Recovery</div>
        <p>A password reset request was initiated for your account.</p>
        <p>Use the one-time verification passcode below to authorize your reset:</p>
        <div class="code">{otp_code}</div>
        <p>This code is single-use and will expire in <strong>5 minutes</strong>.</p>
        <div class="footer">
          If you did not initiate this request, no action is required.<br>
          TECHIE Secure Password Recovery System
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    host = settings.smtp_host.strip()
    configured_port = settings.smtp_port

    # Guard against unconfigured localhost in production
    if settings.app_env == "production" and host in ("127.0.0.1", "localhost"):
        reason = f"Production SMTP_HOST is not configured (currently {host}:{configured_port})"
        print(f"[EmailService] {reason}")
        return False, reason

    # Brevo supports port 587 and port 2525 (alternative). Port 465 is not supported on Brevo relay.
    is_brevo = "brevo.com" in host.lower() or "sendinblue.com" in host.lower()
    if is_brevo and (not settings.smtp_username or not settings.smtp_password):
        reason = "Brevo SMTP requires SMTP_USERNAME and SMTP_PASSWORD in Render Environment Variables"
        print(f"[EmailService] {reason}")
        return False, reason

    if is_brevo:
        ports_to_try = [587, 2525] if configured_port in (465, 587) else [configured_port, 587, 2525]
    else:
        ports_to_try = [configured_port]

    last_err = None
    for port in ports_to_try:
        try:
            if port == 465:
                server = smtplib.SMTP_SSL(host, port, timeout=8)
            else:
                server = smtplib.SMTP(host, port, timeout=8)

            with server:
                if settings.smtp_use_tls and port != 465:
                    server.starttls()
                if settings.smtp_username and settings.smtp_password:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(settings.smtp_from_email, [recipient_email], msg.as_string())
            return True, f"Delivered via {host}:{port}"
        except Exception as e:
            last_err = e
            err_type = type(e).__name__
            clean_msg = str(e).strip()[:100]
            print(f"[EmailService] Attempt on {host}:{port} failed: {err_type} - {clean_msg}")

    err_type = type(last_err).__name__ if last_err else "ConnectionError"
    clean_err = str(last_err).strip()[:120] if last_err else "Failed to connect"
    sanitized_reason = f"{host}:{ports_to_try[0]} [{err_type}]: {clean_err}"
    return False, sanitized_reason

def verify_smtp_connection() -> tuple[bool, str]:
    """
    Tests SMTP connectivity and authentication without sending an email.
    Returns (success: bool, detail: str).
    Never exposes passwords, keys, or tokens.
    """
    host = settings.smtp_host.strip()
    port = settings.smtp_port

    is_brevo = "brevo.com" in host.lower() or "sendinblue.com" in host.lower()
    ports_to_try = [587, 2525] if (is_brevo and port in (465, 587)) else [port]

    last_err = None
    for p in ports_to_try:
        try:
            if p == 465:
                server = smtplib.SMTP_SSL(host, p, timeout=8)
            else:
                server = smtplib.SMTP(host, p, timeout=8)

            with server:
                server.ehlo()
                if settings.smtp_use_tls and p != 465:
                    server.starttls()
                    server.ehlo()
                if settings.smtp_username and settings.smtp_password:
                    server.login(settings.smtp_username, settings.smtp_password)
            return True, f"Successfully connected and authenticated with {host}:{p}"
        except Exception as e:
            last_err = e
            err_type = type(e).__name__
            clean_msg = str(e).strip()[:120]
            print(f"[EmailService Check] Test to {host}:{p} failed: {err_type} - {clean_msg}")

    err_type = type(last_err).__name__ if last_err else "UnknownError"
    clean_err = str(last_err).strip()[:120] if last_err else "Connection failed"
    return False, f"Failed on {host}:{ports_to_try[0]} [{err_type}]: {clean_err}"
