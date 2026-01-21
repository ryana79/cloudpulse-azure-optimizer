from __future__ import annotations

from typing import Any

import httpx


async def query_cost_management(access_token: str, subscription_id: str, query: dict[str, Any]) -> dict[str, Any]:
    url = (
        "https://management.azure.com/subscriptions/"
        f"{subscription_id}/providers/Microsoft.CostManagement/query?api-version=2023-03-01"
    )
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=query)
        response.raise_for_status()
        return response.json()

