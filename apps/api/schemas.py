from __future__ import annotations

from datetime import date
from typing import Any, Literal

from pydantic import BaseModel, Field


class MeResponse(BaseModel):
    tenant_id: str
    user_id: str
    email: str | None
    name: str | None


class SubscriptionResponse(BaseModel):
    id: str
    display_name: str


class IngestRequest(BaseModel):
    subscription_ids: list[str] = Field(default_factory=list)


class IngestResponse(BaseModel):
    run_id: str


class SummaryResponse(BaseModel):
    cost_total_30d: float
    top_services: list[tuple[str, int]]
    inventory_by_region: dict[str, int]
    inventory_by_type: dict[str, int]
    findings_count: int


class CostPointResponse(BaseModel):
    date: date
    cost: float


class CostTimeseriesResponse(BaseModel):
    points: list[CostPointResponse]


class AnomalyResponse(BaseModel):
    id: str
    subscription_id: str
    scope_type: str
    scope_value: str
    date: date
    z_score: float
    cost: float
    mean: float
    stddev: float
    is_active: bool


class FindingResponse(BaseModel):
    id: str
    subscription_id: str
    rule_id: str
    title: str
    severity: str
    evidence: dict[str, Any]
    estimated_savings: float | None
    status: str


class CopilotChatRequest(BaseModel):
    question: str
    subscription_id: str


class CopilotChatResponse(BaseModel):
    answer: str
    actions: list[str]
    warnings: list[str]


class CopilotRemediateRequest(BaseModel):
    selected_findings: list[str]
    format: Literal["azcli", "terraform", "bicep"] = "azcli"


class CopilotRemediateResponse(BaseModel):
    script: str
    warnings: list[str]

