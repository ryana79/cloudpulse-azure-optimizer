from datetime import datetime, timedelta, timezone

from engine.rules import (
    advisor_findings,
    missing_required_tags,
    orphaned_public_ips,
    stale_snapshots,
    unattached_disks,
    underutilized_vms,
)


def test_missing_required_tags() -> None:
    resources = [
        {"resource_id": "r1", "name": "vm1", "resource_type": "Microsoft.Compute/virtualMachines"},
        {"resource_id": "r2", "name": "db1", "resource_type": "Microsoft.DBforPostgreSQL/servers", "tags": {"owner": "a"}},
    ]
    findings = missing_required_tags(resources)
    assert len(findings) == 2
    assert findings[0].rule_id == "missing_required_tags"


def test_missing_required_tags_ignores_fully_tagged_resources() -> None:
    resources = [
        {
            "resource_id": "r1",
            "name": "vm1",
            "resource_type": "Microsoft.Compute/virtualMachines",
            "tags": {"owner": "a", "env": "prod", "costcenter": "cc-1"},
        },
    ]
    assert missing_required_tags(resources) == []


def test_missing_required_tags_reports_sorted_missing_tags() -> None:
    resources = [
        {"resource_id": "r1", "name": "vm1", "resource_type": "t", "tags": {"env": "dev"}},
    ]
    findings = missing_required_tags(resources)
    assert findings[0].evidence["missing_tags"] == ["costcenter", "owner"]


def _vm_metrics(values: list[float], *, resource_type: str = "Microsoft.Compute/virtualMachines") -> dict:
    now = datetime.utcnow()
    return {
        "resource_id": "vm-1",
        "name": "vm-1",
        "resource_type": resource_type,
        "estimated_savings": 42.0,
        "samples": [
            {"timestamp": (now - timedelta(hours=i)).isoformat(), "value": value}
            for i, value in enumerate(values)
        ],
    }


def test_underutilized_vms_flags_low_cpu() -> None:
    findings = underutilized_vms([_vm_metrics([2.0, 4.0, 3.0])], cpu_threshold=5.0, window_days=7)
    assert len(findings) == 1
    assert findings[0].rule_id == "underutilized_vm"
    assert findings[0].evidence["avg_cpu"] == 3.0
    assert findings[0].estimated_savings == 42.0


def test_underutilized_vms_skips_busy_vms() -> None:
    findings = underutilized_vms([_vm_metrics([80.0, 90.0])], cpu_threshold=5.0, window_days=7)
    assert findings == []


def test_underutilized_vms_ignores_non_vm_resources() -> None:
    metrics = [_vm_metrics([1.0], resource_type="Microsoft.Storage/storageAccounts")]
    assert underutilized_vms(metrics, cpu_threshold=5.0, window_days=7) == []


def test_underutilized_vms_ignores_samples_outside_window() -> None:
    now = datetime.utcnow()
    metrics = [
        {
            "resource_id": "vm-1",
            "name": "vm-1",
            "resource_type": "Microsoft.Compute/virtualMachines",
            "samples": [{"timestamp": (now - timedelta(days=30)).isoformat(), "value": 1.0}],
        }
    ]
    assert underutilized_vms(metrics, cpu_threshold=5.0, window_days=7) == []


def test_unattached_disks_only_flags_unmanaged_disks() -> None:
    resources = [
        {"resource_id": "d1", "name": "d1", "resource_type": "Microsoft.Compute/disks", "properties": {"managedBy": None}},
        {"resource_id": "d2", "name": "d2", "resource_type": "Microsoft.Compute/disks", "properties": {"managedBy": "/vm/1"}},
        {"resource_id": "v1", "name": "v1", "resource_type": "Microsoft.Compute/virtualMachines", "properties": {}},
    ]
    findings = unattached_disks(resources)
    assert [f.evidence["resource_id"] for f in findings] == ["d1"]


def test_orphaned_public_ips_flags_missing_ip_configuration() -> None:
    resources = [
        {"resource_id": "ip1", "name": "ip1", "resource_type": "Microsoft.Network/publicIPAddresses", "properties": {}},
        {
            "resource_id": "ip2",
            "name": "ip2",
            "resource_type": "Microsoft.Network/publicIPAddresses",
            "properties": {"ipConfiguration": {"id": "/nic/1"}},
        },
    ]
    findings = orphaned_public_ips(resources)
    assert [f.evidence["resource_id"] for f in findings] == ["ip1"]


def test_stale_snapshots_respects_age_cutoff() -> None:
    now = datetime.now(timezone.utc)
    resources = [
        {
            "resource_id": "old",
            "name": "old",
            "resource_type": "Microsoft.Compute/snapshots",
            "properties": {"timeCreated": (now - timedelta(days=45)).isoformat().replace("+00:00", "Z")},
        },
        {
            "resource_id": "fresh",
            "name": "fresh",
            "resource_type": "Microsoft.Compute/snapshots",
            "properties": {"timeCreated": (now - timedelta(days=5)).isoformat().replace("+00:00", "Z")},
        },
    ]
    findings = stale_snapshots(resources, days=30)
    assert [f.evidence["resource_id"] for f in findings] == ["old"]
    assert findings[0].severity == "low"


def test_advisor_findings_maps_category_impact_and_savings() -> None:
    recommendations = [
        {
            "id": "rec-1",
            "category": "Cost",
            "impact": "High",
            "shortDescription": {"problem": "Underused SKU", "solution": "Resize the VM"},
            "extendedProperties": {"annualSavings": 1200.0},
        }
    ]
    findings = advisor_findings(recommendations)
    assert findings[0].rule_id == "advisor_cost"
    assert findings[0].severity == "high"
    assert findings[0].title == "Resize the VM"
    assert findings[0].estimated_savings == 1200.0
