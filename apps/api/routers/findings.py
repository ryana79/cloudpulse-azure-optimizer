from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_current_user
from db.repositories import get_finding, list_findings
from db.session import get_session
from schemas import FindingResponse


router = APIRouter()


@router.get("/findings", response_model=list[FindingResponse])
def findings(
    subscription_id: str | None = Query(default=None),
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[FindingResponse]:
    rows = list_findings(session, user.tenant_id, user.user_id, subscription_id)
    return [
        FindingResponse(
            id=row.id,
            subscription_id=row.subscription_id,
            rule_id=row.rule_id,
            title=row.title,
            severity=row.severity,
            evidence=row.evidence,
            estimated_savings=row.estimated_savings,
            status=row.status,
        )
        for row in rows
    ]


@router.get("/findings/{finding_id}", response_model=FindingResponse)
def finding_detail(
    finding_id: str,
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> FindingResponse:
    row = get_finding(session, user.tenant_id, user.user_id, finding_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return FindingResponse(
        id=row.id,
        subscription_id=row.subscription_id,
        rule_id=row.rule_id,
        title=row.title,
        severity=row.severity,
        evidence=row.evidence,
        estimated_savings=row.estimated_savings,
        status=row.status,
    )

