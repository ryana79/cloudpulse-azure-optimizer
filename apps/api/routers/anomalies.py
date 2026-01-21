from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_current_user
from db.repositories import get_anomaly, list_anomalies
from db.session import get_session
from schemas import AnomalyResponse


router = APIRouter()


@router.get("/anomalies", response_model=list[AnomalyResponse])
def anomalies(
    subscription_id: str | None = Query(default=None),
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[AnomalyResponse]:
    rows = list_anomalies(session, user.tenant_id, user.user_id, subscription_id)
    return [
        AnomalyResponse(
            id=row.id,
            subscription_id=row.subscription_id,
            scope_type=row.scope_type,
            scope_value=row.scope_value,
            date=row.date,
            z_score=row.z_score,
            cost=row.cost,
            mean=row.mean,
            stddev=row.stddev,
            is_active=row.is_active,
        )
        for row in rows
    ]


@router.get("/anomalies/{anomaly_id}", response_model=AnomalyResponse)
def anomaly_detail(
    anomaly_id: str,
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> AnomalyResponse:
    row = get_anomaly(session, user.tenant_id, user.user_id, anomaly_id)
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return AnomalyResponse(
        id=row.id,
        subscription_id=row.subscription_id,
        scope_type=row.scope_type,
        scope_value=row.scope_value,
        date=row.date,
        z_score=row.z_score,
        cost=row.cost,
        mean=row.mean,
        stddev=row.stddev,
        is_active=row.is_active,
    )

