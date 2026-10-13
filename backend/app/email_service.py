import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

def send_otp_email(recipient_email: str, otp_code: str) -> bool:
    """
    Sends the 6-digit OTP code to recipient_email via configured SMTP.
    Supports local Mailpit (plaintext) or production SMTP (STARTTLS & Authentication).
    Does NOT log the OTP in stdout.
    Returns True on success, False on failure.
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
        <p>A password reset request was initiated for your demo account.</p>
        <p>Use the one-time verification passcode below to authorize your reset:</p>
        <div class="code">{otp_code}</div>
        <p>This code is single-use and will expire in <strong>5 minutes</strong>.</p>
        <div class="footer">
          If you did not initiate this request, no action is required.<br>
          Academic project demonstration — local test email delivery.
        </div>
      </div>
    </body>
    </html>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, [recipient_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[EmailService] Failed to send email via SMTP {settings.smtp_host}:{settings.smtp_port}: {str(e)}")
        return False
