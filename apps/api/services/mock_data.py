from __future__ import annotations

import json
from pathlib import Path
from typing import Any


FIXTURES_DIR = Path(__file__).resolve().parents[1] / "fixtures"


def load_fixture(name: str) -> list[dict[str, Any]] | dict[str, Any]:
    path = FIXTURES_DIR / name
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)

