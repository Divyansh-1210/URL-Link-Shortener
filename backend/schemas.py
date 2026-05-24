from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


# ── Auth Schemas ───────────────────────────────────────────────────────
class UserRegister(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── URL Schemas ────────────────────────────────────────────────────────
class URLCreate(BaseModel):
    long_url: str
    custom_code: Optional[str] = None


class URLResponse(BaseModel):
    short_code: str
    long_url: str
    short_url: str
    created_at: datetime
    click_count: int
    owner: Optional[str] = None  # username of owner, if any

    class Config:
        from_attributes = True


class URLStats(BaseModel):
    short_code: str
    long_url: str
    short_url: str
    click_count: int
    created_at: datetime
    owner: Optional[str] = None

    class Config:
        from_attributes = True
