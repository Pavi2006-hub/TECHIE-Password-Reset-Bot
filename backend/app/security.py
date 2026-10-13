import hashlib
import hmac
import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from app.config import settings

ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def hash_password(password: str) -> str:
    """Hash password securely using Argon2id."""
    return ph.hash(password)

def verify_password(hash_str: str, password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return ph.verify(hash_str, password)
    except (VerifyMismatchError, VerificationError):
        return False

def generate_otp() -> str:
    """Generate a cryptographically random 6-digit OTP."""
    num = secrets.randbelow(1_000_000)
    return f"{num:06d}"

def compute_otp_verifier(challenge_id: str, otp: str) -> str:
    """Compute keyed HMAC-SHA256 verifier for OTP using configurable secret."""
    msg = f"{challenge_id}:{otp}".encode("utf-8")
    return hmac.new(settings.secret_key.encode("utf-8"), msg, hashlib.sha256).hexdigest()

def verify_otp_match(challenge_id: str, input_otp: str, stored_verifier: str) -> bool:
    """Constant-time compare computed verifier with stored verifier."""
    computed = compute_otp_verifier(challenge_id, input_otp)
    return hmac.compare_digest(computed, stored_verifier)

def generate_token_pair() -> tuple[str, str]:
    """Generate random raw token and its SHA256 storage hash."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash

def hash_token(raw_token: str) -> str:
    """Hash a token for database lookup."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def mask_email(email: str) -> str:
    """Mask email for privacy-preserving audit logs (e.g. j***e@example.com)."""
    if "@" not in email:
        return "***"
    local, domain = email.split("@", 1)
    if len(local) <= 2:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    return f"{masked_local}@{domain}"
