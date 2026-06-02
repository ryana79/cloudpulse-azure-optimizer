from __future__ import annotations

from typing import Any

import httpx


async def list_subscriptions(access_token: str) -> list[dict[str, Any]]:
    url = "https://management.azure.com/subscriptions?api-version=2020-01-01"
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        payload = response.json()
    return payload.get("value", [])

