from dataclasses import dataclass

from fastapi import Header, HTTPException, status

from auth.jwt import validate_jwt
from config import settings


@dataclass(frozen=True)
class UserContext:
    tenant_id: str
    user_id: str
    email: str | None
    name: str | None


def get_current_user(authorization: str | None = Header(default=None)) -> UserContext:
    if settings.mock_mode:
        return UserContext(
            tenant_id=settings.mock_tenant_id,
            user_id=settings.mock_user_id,
            email=settings.mock_user_email,
            name=settings.mock_user_name,
        )

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")

    token = authorization.replace("Bearer ", "").strip()
    try:
        claims = validate_jwt(token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    return UserContext(
        tenant_id=claims["tid"],
        user_id=claims["oid"],
        email=claims.get("preferred_username"),
        name=claims.get("name"),
    )


def get_bearer_token(authorization: str | None = Header(default=None)) -> str:
    if settings.mock_mode:
        return "mock"
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    return authorization.replace("Bearer ", "").strip()

