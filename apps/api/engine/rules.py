from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any


@dataclass(frozen=True)
class RuleFinding:
    rule_id: str
    title: str
    severity: str
    evidence: dict[str, Any]
    estimated_savings: float | None = None


REQUIRED_TAGS = {"owner", "env", "costcenter"}


def missing_required_tags(resources: list[dict[str, Any]]) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    for resource in resources:
        tags = resource.get("tags") or {}
        missing = sorted(tag for tag in REQUIRED_TAGS if tag not in tags)
        if missing:
            findings.append(
                RuleFinding(
                    rule_id="missing_required_tags",
                    title=f"Missing required tags on {resource.get('name')}",
                    severity="medium",
                    evidence={
                        "resource_id": resource.get("resource_id"),
                        "missing_tags": missing,
                        "resource_type": resource.get("resource_type"),
                    },
                )
            )
    return findings


def underutilized_vms(
    metrics: list[dict[str, Any]],
    cpu_threshold: float,
    window_days: int,
) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    cutoff = datetime.utcnow() - timedelta(days=window_days)
    for item in metrics:
        if item.get("resource_type") != "Microsoft.Compute/virtualMachines":
            continue
        samples = [s for s in item.get("samples", []) if s["timestamp"] >= cutoff.isoformat()]
        if not samples:
            continue
        avg_cpu = sum(s["value"] for s in samples) / len(samples)
        if avg_cpu <= cpu_threshold:
            findings.append(
                RuleFinding(
                    rule_id="underutilized_vm",
                    title=f"Underutilized VM {item.get('name')}",
                    severity="high",
                    evidence={
                        "resource_id": item.get("resource_id"),
                        "avg_cpu": round(avg_cpu, 2),
                        "window_days": window_days,
                    },
                    estimated_savings=item.get("estimated_savings"),
                )
            )
    return findings


def unattached_disks(resources: list[dict[str, Any]]) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    for resource in resources:
        if resource.get("resource_type") != "Microsoft.Compute/disks":
            continue
        if resource.get("properties", {}).get("managedBy") is None:
            findings.append(
                RuleFinding(
                    rule_id="unattached_disk",
                    title=f"Unattached disk {resource.get('name')}",
                    severity="medium",
                    evidence={"resource_id": resource.get("resource_id")},
                )
            )
    return findings


def orphaned_public_ips(resources: list[dict[str, Any]]) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    for resource in resources:
        if resource.get("resource_type") != "Microsoft.Network/publicIPAddresses":
            continue
        if not resource.get("properties", {}).get("ipConfiguration"):
            findings.append(
                RuleFinding(
                    rule_id="orphaned_public_ip",
                    title=f"Orphaned public IP {resource.get('name')}",
                    severity="medium",
                    evidence={"resource_id": resource.get("resource_id")},
                )
            )
    return findings


def stale_snapshots(resources: list[dict[str, Any]], days: int = 30) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    for resource in resources:
        if resource.get("resource_type") != "Microsoft.Compute/snapshots":
            continue
        created = resource.get("properties", {}).get("timeCreated")
        if created:
            created_dt = datetime.fromisoformat(created.replace("Z", "+00:00")).astimezone(timezone.utc)
            if created_dt < cutoff:
                findings.append(
                    RuleFinding(
                        rule_id="stale_snapshot",
                        title=f"Stale snapshot {resource.get('name')}",
                        severity="low",
                        evidence={"resource_id": resource.get("resource_id"), "created_at": created},
                    )
                )
    return findings


def advisor_findings(recommendations: list[dict[str, Any]]) -> list[RuleFinding]:
    findings: list[RuleFinding] = []
    for rec in recommendations:
        findings.append(
            RuleFinding(
                rule_id=f"advisor_{rec.get('category', 'general').lower()}",
                title=rec.get("shortDescription", {}).get("solution", "Advisor recommendation"),
                severity=rec.get("impact", "medium").lower(),
                evidence={
                    "recommendation_id": rec.get("id"),
                    "description": rec.get("shortDescription", {}).get("problem"),
                },
                estimated_savings=rec.get("extendedProperties", {}).get("annualSavings"),
            )
        )
    return findings

