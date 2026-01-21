from __future__ import annotations

from typing import Any

import httpx


async def list_advisor_recommendations(access_token: str, subscription_id: str) -> list[dict[str, Any]]:
    url = (
        "https://management.azure.com/subscriptions/"
        f"{subscription_id}/providers/Microsoft.Advisor/recommendations"
        "?api-version=2020-01-01"
    )
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
    return data.get("value", [])

