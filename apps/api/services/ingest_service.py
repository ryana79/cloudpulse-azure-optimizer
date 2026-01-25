from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import delete
from sqlalchemy.orm import Session

from auth.deps import UserContext
from config import settings
from db.models import Anomaly, CostDaily, Finding, IngestionRun, ResourceInventory, Subscription
from engine.anomalies import CostPoint, detect_anomalies
from engine.rules import (
    advisor_findings,
    missing_required_tags,
    orphaned_public_ips,
    stale_snapshots,
    underutilized_vms,
    unattached_disks,
)
from azure.advisor import list_advisor_recommendations
from azure.cost import query_cost_management
from azure.metrics import query_metrics
from azure.obo import acquire_obo_token
from azure.resource_graph import query_resource_graph
from services.mock_data import load_fixture


def _parse_date(value: str) -> date:
    cleaned = value
    if value.isdigit() and len(value) == 8:
        cleaned = f"{value[:4]}-{value[4:6]}-{value[6:]}"
    return datetime.fromisoformat(cleaned).date()


def _clear_existing(session: Session, tenant_id: str, user_id: str, subscription_id: str) -> None:
    for model in [CostDaily, ResourceInventory, Finding, Anomaly]:
        session.execute(
            delete(model).where(
                model.tenant_id == tenant_id,
                model.user_id == user_id,
                model.subscription_id == subscription_id,
            )
        )


def ingest_mock(session: Session, user: UserContext, subscription_ids: list[str] | None = None) -> str:
    subscriptions = load_fixture("subscriptions.json")
    if subscription_ids:
        subscriptions = [s for s in subscriptions if s["subscription_id"] in subscription_ids]

    run_id = uuid4().hex
    total_findings = 0
    total_anomalies = 0
    total_resources = 0
    for sub in subscriptions:
        subscription_id = sub["subscription_id"]
        scenario = sub.get("scenario")
        _clear_existing(session, user.tenant_id, user.user_id, subscription_id)

        session.merge(
            Subscription(
                id=subscription_id,
                tenant_id=user.tenant_id,
                user_id=user.user_id,
                display_name=sub["display_name"],
            )
        )

        inventory = _apply_subscription_scope(
            load_fixture("inventory.json", scenario), subscription_id
        )
        total_resources += len(inventory)
        for item in inventory:
            session.add(
                ResourceInventory(
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    resource_id=item["resource_id"],
                    name=item["name"],
                    resource_type=item["resource_type"],
                    region=item["region"],
                    tags=item.get("tags"),
                )
            )

        costs = load_fixture("cost.json", scenario)
        for item in costs:
            session.add(
                CostDaily(
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    date=_parse_date(item["date"]),
                    cost=item["cost"],
                    service=item.get("service"),
                    resource_group=item.get("resource_group"),
                    tag=item.get("tag"),
                )
            )

        advisor = load_fixture("advisor.json", scenario)
        metrics = _apply_subscription_scope(
            load_fixture("metrics.json", scenario), subscription_id
        )

        findings: list[Any] = []
        findings.extend(missing_required_tags(inventory))
        findings.extend(unattached_disks(inventory))
        findings.extend(orphaned_public_ips(inventory))
        findings.extend(stale_snapshots(inventory))
        findings.extend(
            underutilized_vms(
                metrics,
                cpu_threshold=settings.underutilized_cpu_threshold,
                window_days=settings.underutilized_days,
            )
        )
        findings.extend(advisor_findings(advisor))

        for finding in findings:
            session.add(
                Finding(
                    id=uuid4().hex,
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    rule_id=finding.rule_id,
                    title=finding.title,
                    severity=finding.severity,
                    evidence=finding.evidence,
                    estimated_savings=finding.estimated_savings,
                    status="open",
                )
            )

        anomalies = _detect_anomalies(costs)
        total_findings += len(findings)
        total_anomalies += len(anomalies)
        for anomaly in anomalies:
            session.add(
                Anomaly(
                    id=uuid4().hex,
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    scope_type=anomaly["scope_type"],
                    scope_value=anomaly["scope_value"],
                    date=anomaly["date"],
                    z_score=anomaly["z_score"],
                    cost=anomaly["cost"],
                    mean=anomaly["mean"],
                    stddev=anomaly["stddev"],
                    is_active=True,
                )
            )

    session.add(
        IngestionRun(
            id=run_id,
            tenant_id=user.tenant_id,
            user_id=user.user_id,
            subscription_id=subscriptions[0]["subscription_id"] if subscriptions else "unknown",
            status="success",
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            resources_ingested=total_resources if subscriptions else 0,
            findings_created=total_findings if subscriptions else 0,
            anomalies_created=total_anomalies if subscriptions else 0,
            error_message=None,
        )
    )
    session.commit()
    return run_id


def _apply_subscription_scope(
    items: list[dict[str, Any]], subscription_id: str
) -> list[dict[str, Any]]:
    for item in items:
        resource_id = item.get("resource_id")
        if isinstance(resource_id, str):
            item["resource_id"] = resource_id.replace(
                "/subscriptions/sub-001", f"/subscriptions/{subscription_id}"
            )
    return items


async def ingest_real(
    session: Session,
    user: UserContext,
    access_token: str,
    subscription_ids: list[str],
) -> str:
    obo_token = acquire_obo_token(access_token)
    run_id = uuid4().hex
    total_findings = 0
    total_anomalies = 0
    total_resources = 0

    for subscription_id in subscription_ids:
        _clear_existing(session, user.tenant_id, user.user_id, subscription_id)
        session.merge(
            Subscription(
                id=subscription_id,
                tenant_id=user.tenant_id,
                user_id=user.user_id,
                display_name=subscription_id,
            )
        )

        resources = await query_resource_graph(
            obo_token,
            [subscription_id],
            "Resources | project id, name, type, location, tags, properties",
        )
        total_resources += len(resources)
        inventory = [
            {
                "resource_id": r.get("id"),
                "name": r.get("name"),
                "resource_type": r.get("type"),
                "region": r.get("location"),
                "tags": r.get("tags"),
                "properties": r.get("properties", {}),
            }
            for r in resources
        ]
        for item in inventory:
            session.add(
                ResourceInventory(
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    resource_id=item["resource_id"],
                    name=item["name"],
                    resource_type=item["resource_type"],
                    region=item.get("region") or "unknown",
                    tags=item.get("tags"),
                )
            )

        advisor = await list_advisor_recommendations(obo_token, subscription_id)

        cost_query = {
            "type": "Usage",
            "timeframe": "Last30Days",
            "dataset": {
                "granularity": "Daily",
                "aggregation": {"totalCost": {"name": "PreTaxCost", "function": "Sum"}},
                "grouping": [{"type": "Dimension", "name": "ServiceName"}],
            },
        }
        cost_response = await query_cost_management(obo_token, subscription_id, cost_query)
        columns = [c["name"] for c in cost_response.get("properties", {}).get("columns", [])]
        rows = cost_response.get("properties", {}).get("rows", [])
        cost_items: list[dict[str, Any]] = []
        for row in rows:
            row_dict = dict(zip(columns, row))
            cost_items.append(
                {
                    "date": row_dict.get("UsageDate"),
                    "cost": float(row_dict.get("PreTaxCost", 0)),
                    "service": row_dict.get("ServiceName"),
                    "resource_group": row_dict.get("ResourceGroupName"),
                }
            )
        for item in cost_items:
            if not item.get("date"):
                continue
            session.add(
                CostDaily(
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    date=_parse_date(str(item["date"])),
                    cost=item["cost"],
                    service=item.get("service"),
                    resource_group=item.get("resource_group"),
                    tag=None,
                )
            )

        metrics: list[dict[str, Any]] = []
        for vm in [r for r in inventory if r.get("resource_type") == "Microsoft.Compute/virtualMachines"][:10]:
            metric_data = await query_metrics(obo_token, vm["resource_id"], "Percentage CPU")
            series = metric_data.get("value", [{}])[0].get("timeseries", [])
            samples = []
            for entry in series:
                for data in entry.get("data", []):
                    if "average" in data:
                        samples.append({"timestamp": data["timeStamp"], "value": data["average"]})
            metrics.append(
                {
                    "resource_id": vm["resource_id"],
                    "name": vm["name"],
                    "resource_type": vm["resource_type"],
                    "samples": samples,
                }
            )

        findings = []
        findings.extend(missing_required_tags(inventory))
        findings.extend(unattached_disks(inventory))
        findings.extend(orphaned_public_ips(inventory))
        findings.extend(stale_snapshots(inventory))
        findings.extend(
            underutilized_vms(
                metrics,
                cpu_threshold=settings.underutilized_cpu_threshold,
                window_days=settings.underutilized_days,
            )
        )
        findings.extend(advisor_findings(advisor))
        for finding in findings:
            session.add(
                Finding(
                    id=uuid4().hex,
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    rule_id=finding.rule_id,
                    title=finding.title,
                    severity=finding.severity,
                    evidence=finding.evidence,
                    estimated_savings=finding.estimated_savings,
                    status="open",
                )
            )

        anomalies = _detect_anomalies(cost_items)
        total_findings += len(findings)
        total_anomalies += len(anomalies)
        for anomaly in anomalies:
            session.add(
                Anomaly(
                    id=uuid4().hex,
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    subscription_id=subscription_id,
                    scope_type=anomaly["scope_type"],
                    scope_value=anomaly["scope_value"],
                    date=anomaly["date"],
                    z_score=anomaly["z_score"],
                    cost=anomaly["cost"],
                    mean=anomaly["mean"],
                    stddev=anomaly["stddev"],
                    is_active=True,
                )
            )

    session.add(
        IngestionRun(
            id=run_id,
            tenant_id=user.tenant_id,
            user_id=user.user_id,
            subscription_id=subscription_ids[0] if subscription_ids else "unknown",
            status="success",
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            resources_ingested=total_resources if subscription_ids else 0,
            findings_created=total_findings if subscription_ids else 0,
            anomalies_created=total_anomalies if subscription_ids else 0,
            error_message=None,
        )
    )
    session.commit()
    return run_id


def _detect_anomalies(costs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_scope: dict[tuple[str, str], list[CostPoint]] = defaultdict(list)
    for item in costs:
        point = CostPoint(date=_parse_date(item["date"]), cost=float(item["cost"]))
        by_scope[("subscription", "total")].append(point)
        if item.get("resource_group"):
            by_scope[("resource_group", item["resource_group"])].append(point)
        if item.get("service"):
            by_scope[("service", item["service"])].append(point)

    anomalies: list[dict[str, Any]] = []
    for (scope_type, scope_value), points in by_scope.items():
        points = sorted(points, key=lambda p: p.date)
        results = detect_anomalies(
            points,
            window=14,
            z_threshold=settings.anomaly_z_threshold,
            min_abs=settings.anomaly_min_abs,
        )
        for result in results:
            anomalies.append(
                {
                    "scope_type": scope_type,
                    "scope_value": scope_value,
                    "date": result.date,
                    "z_score": result.z_score,
                    "cost": result.cost,
                    "mean": result.mean,
                    "stddev": result.stddev,
                }
            )
    return anomalies

