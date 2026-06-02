from __future__ import annotations

import time
from typing import Any

import jwt
from cachetools import TTLCache
from jwt import PyJWKClient

from config import settings


_jwks_cache: TTLCache[str, PyJWKClient] = TTLCache(maxsize=10, ttl=3600)


def _get_jwks_client(tenant_id: str) -> PyJWKClient:
    cache_key = tenant_id or "common"
    if cache_key in _jwks_cache:
        return _jwks_cache[cache_key]
    jwks_url = f"{settings.azure_authority}/{cache_key}/discovery/v2.0/keys"
    client = PyJWKClient(jwks_url)
    _jwks_cache[cache_key] = client
    return client


def validate_jwt(token: str) -> dict[str, Any]:
    if not token:
        raise ValueError("Missing token")

    unverified = jwt.decode(token, options={"verify_signature": False})
    tenant_id = unverified.get("tid")
    user_id = unverified.get("oid")
    if not tenant_id or not user_id:
        raise ValueError("Token missing tid/oid")

    issuer = f"{settings.azure_authority}/{tenant_id}/v2.0"
    jwks_client = _get_jwks_client(tenant_id)
    signing_key = jwks_client.get_signing_key_from_jwt(token).key

    decoded = jwt.decode(
        token,
        signing_key,
        algorithms=["RS256"],
        audience=settings.azure_client_id,
        issuer=issuer,
        options={"require": ["exp", "nbf", "iat"]},
    )
    if decoded.get("exp", 0) < time.time():
        raise ValueError("Token expired")
    if not decoded.get("tid") or not decoded.get("oid"):
        raise ValueError("Token missing tid/oid")
    return decoded

