from __future__ import annotations

from typing import Any

import httpx


async def query_resource_graph(access_token: str, subscriptions: list[str], query: str) -> list[dict[str, Any]]:
    url = "https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01"
    headers = {"Authorization": f"Bearer {access_token}"}
    payload = {"subscriptions": subscriptions, "query": query}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
    return data.get("data", [])

