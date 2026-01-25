from __future__ import annotations

import json
from pathlib import Path
from typing import Any


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


def load_fixture(name: str, scenario: str | None = None) -> list[dict[str, Any]] | dict[str, Any]:
    if scenario:
        scenario_path = _scenario_path(name, scenario)
        if scenario_path.exists():
            return _load_json(scenario_path)
    path = FIXTURES_DIR / name
    return _load_json(path)


def _scenario_path(name: str, scenario: str) -> Path:
    path = Path(name)
    return FIXTURES_DIR / f"{path.stem}-{scenario}{path.suffix}"


def _load_json(path: Path) -> list[dict[str, Any]] | dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)

