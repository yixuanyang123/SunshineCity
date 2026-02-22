from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Trip (for Unity: origin/destination as lat-lng, departure as hour+minute) ---

class LatLng(BaseModel):
    lat: float
    lng: float

class DepartureTime(BaseModel):
    hour: int = Field(..., ge=0, le=23)
    minute: int = Field(..., ge=0, le=59)

class TripCreate(BaseModel):
    origin: LatLng
    destination: LatLng
    departure: DepartureTime
    anonymous_id: Optional[str] = None  # required when no Bearer token

class TripOut(BaseModel):
    id: int
    user_email: Optional[str] = None
    anonymous_id: Optional[str] = None
    origin: LatLng
    destination: LatLng
    departure: DepartureTime
    created_at: datetime
