from __future__ import annotations

from collections import Counter, defaultdict
from datetime import date, timedelta
from typing import Any

from sqlalchemy.orm import Session

from db.models import CostDaily, Finding, ResourceInventory


def build_summary(session: Session, tenant_id: str, user_id: str, subscription_id: str) -> dict[str, Any]:
    costs = (
        session.query(CostDaily)
        .filter(
            CostDaily.tenant_id == tenant_id,
            CostDaily.user_id == user_id,
            CostDaily.subscription_id == subscription_id,
        )
        .all()
    )
    inventory = (
        session.query(ResourceInventory)
        .filter(
            ResourceInventory.tenant_id == tenant_id,
            ResourceInventory.user_id == user_id,
            ResourceInventory.subscription_id == subscription_id,
        )
        .all()
    )
    findings = (
        session.query(Finding)
        .filter(
            Finding.tenant_id == tenant_id,
            Finding.user_id == user_id,
            Finding.subscription_id == subscription_id,
        )
        .all()
    )

    last_30_days = date.today() - timedelta(days=30)
    cost_total = sum(c.cost for c in costs if c.date >= last_30_days)

    by_service = Counter(c.service or "unknown" for c in costs)
    by_region = Counter(i.region for i in inventory)
    by_type = Counter(i.resource_type for i in inventory)

    return {
        "cost_total_30d": round(cost_total, 2),
        "top_services": by_service.most_common(5),
        "inventory_by_region": by_region,
        "inventory_by_type": by_type,
        "findings_count": len(findings),
    }

