import re
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

class RequestResetInput(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if not EMAIL_REGEX.match(clean):
            raise ValueError("Invalid email format")
        return clean

class GenericResponse(BaseModel):
    message: str
    challenge_id: str | None = None
    request_id: str

class VerifyOtpInput(BaseModel):
    challenge_id: str
    otp: str = Field(..., min_length=6, max_length=6)

class VerifyOtpResponse(BaseModel):
    message: str
    reset_token: str
    expires_in_seconds: int

class ResetPasswordInput(BaseModel):
    reset_token: str
    new_password: str = Field(..., min_length=8)

class ResendOtpInput(BaseModel):
    challenge_id: str
