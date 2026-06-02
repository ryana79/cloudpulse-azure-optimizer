from __future__ import annotations

from typing import Any

import httpx


async def query_metrics(access_token: str, resource_id: str, metric_name: str) -> dict[str, Any]:
    url = (
        "https://management.azure.com"
        f"{resource_id}/providers/microsoft.insights/metrics?api-version=2018-01-01"
        f"&metricnames={metric_name}&interval=PT1H"
    )
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        return response.json()

