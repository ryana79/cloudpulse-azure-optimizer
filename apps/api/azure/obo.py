from __future__ import annotations

from dataclasses import dataclass
from time import time

import msal

from config import settings


@dataclass
class CachedToken:
    token: str
    expires_at: float


_token_cache: dict[str, CachedToken] = {}


def acquire_obo_token(user_access_token: str) -> str:
    cache_key = f"{hash(user_access_token)}"
    cached = _token_cache.get(cache_key)
    if cached and cached.expires_at > time():
        return cached.token

    app = msal.ConfidentialClientApplication(
        client_id=settings.azure_client_id,
        client_credential=settings.azure_client_secret,
        authority=f"{settings.azure_authority}/{settings.azure_tenant_id}",
    )

    result = app.acquire_token_on_behalf_of(
        user_access_token=user_access_token,
        scopes=[settings.azure_scopes],
    )
    if "access_token" not in result:
        raise RuntimeError("Failed to acquire OBO token")

    expires_at = time() + int(result.get("expires_in", 3599))
    token = result["access_token"]
    _token_cache[cache_key] = CachedToken(token=token, expires_at=expires_at)
    return token

