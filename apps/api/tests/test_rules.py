from engine.rules import missing_required_tags


def test_missing_required_tags() -> None:
    resources = [
        {"resource_id": "r1", "name": "vm1", "resource_type": "Microsoft.Compute/virtualMachines"},
        {"resource_id": "r2", "name": "db1", "resource_type": "Microsoft.DBforPostgreSQL/servers", "tags": {"owner": "a"}},
    ]
    findings = missing_required_tags(resources)
    assert len(findings) == 2
    assert findings[0].rule_id == "missing_required_tags"

