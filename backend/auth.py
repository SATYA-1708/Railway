"""
RailFlow AI — JWT Authentication & Role-Based Access Control (RBAC)
Supports roles: passenger, station_master, section_controller, divisional_hq
Uses secure SHA-256 + Salt hashing (zero-dependency, robust across all Python versions)
"""

import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from enum import Enum

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

SECRET_KEY = os.getenv("SECRET_KEY", "railflow-ai-sih2026-super-secure-key-928402")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))  # 8 hours

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


class UserRole(str, Enum):
    PASSENGER = "passenger"
    STATION_MASTER = "station_master"
    SECTION_CONTROLLER = "section_controller"
    DIVISIONAL_HQ = "divisional_hq"


def hash_password(password: str, salt: str = "railflow_salt_2026") -> str:
    """Deterministic salted SHA256 hash for authentication."""
    return hashlib.sha256(f"{salt}:{password}".encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str, salt: str = "railflow_salt_2026") -> bool:
    return hash_password(plain_password, salt) == hashed_password


# Demo users dictionary for hackathon evaluation and fast login
DEMO_USERS = {
    "sm_bza": {
        "username": "sm_bza",
        "password_hash": hash_password("railway123"),
        "full_name": "Station Master — Vijayawada (BZA)",
        "role": UserRole.STATION_MASTER.value,
        "station_code": "BZA",
        "division": "Vijayawada (SCR)"
    },
    "controller_scr": {
        "username": "controller_scr",
        "password_hash": hash_password("railway123"),
        "full_name": "Chief Section Controller — SCR Mainline",
        "role": UserRole.SECTION_CONTROLLER.value,
        "station_code": "BZA",
        "division": "Vijayawada (SCR)"
    },
    "hq_delhi": {
        "username": "hq_delhi",
        "password_hash": hash_password("railway123"),
        "full_name": "Northern Railway Divisional HQ",
        "role": UserRole.DIVISIONAL_HQ.value,
        "station_code": "NDLS",
        "division": "Delhi (NR)"
    }
}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user_from_token(token: Optional[str]) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        station: str = payload.get("station_code")
        if username is None:
            return None
        return {
            "username": username,
            "role": role,
            "station_code": station,
            "full_name": payload.get("full_name", username),
            "division": payload.get("division", "Indian Railways")
        }
    except JWTError:
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user = get_current_user_from_token(token)
    if user is None:
        raise credentials_exception
    return user


async def require_staff_role(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    allowed_roles = [
        UserRole.STATION_MASTER.value,
        UserRole.SECTION_CONTROLLER.value,
        UserRole.DIVISIONAL_HQ.value
    ]
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: Insufficient staff permissions"
        )
    return current_user
