from datetime import datetime, timedelta
from hashlib import sha256
from typing import Any

import bcrypt
from jose import JWTError, jwt

from .config import get_settings

HASH_PREFIX = "bcrypt_sha256$"


def _derive_password_bytes(password: str) -> bytes:
    """Return a fixed-length byte representation safe for bcrypt."""
    return sha256(password.encode("utf-8")).digest()


def create_access_token(data: dict[str, Any], expires_delta: timedelta | None = None) -> str:
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta if expires_delta else timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode["exp"] = expire
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode("utf-8")
    try:
        if hashed_password.startswith(HASH_PREFIX):
            derived = _derive_password_bytes(plain_password)
            stored_hash = hashed_password[len(HASH_PREFIX) :].encode("utf-8")
            return bcrypt.checkpw(derived, stored_hash)
        return bcrypt.checkpw(password_bytes, hashed_password.encode("utf-8"))
    except ValueError as exc:
        if len(password_bytes) > 72:
            raise ValueError("Password exceeds bcrypt maximum length of 72 bytes") from exc
        raise


def get_password_hash(password: str) -> str:
    derived = _derive_password_bytes(password)
    hashed = bcrypt.hashpw(derived, bcrypt.gensalt())
    return f"{HASH_PREFIX}{hashed.decode('utf-8')}"


def decode_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except JWTError as exc:
        raise ValueError("Invalid token") from exc
    return payload
