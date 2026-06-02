from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_current_user
from db.repositories import get_cost_timeseries
from db.session import get_session
from schemas import CostPointResponse, CostTimeseriesResponse


router = APIRouter()


@router.get("/cost/timeseries", response_model=CostTimeseriesResponse)
def cost_timeseries(
    subscription_id: str = Query(...),
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CostTimeseriesResponse:
    rows = get_cost_timeseries(session, user.tenant_id, user.user_id, subscription_id)
    points = [CostPointResponse(date=row.date, cost=row.cost) for row in rows]
    return CostTimeseriesResponse(points=points)

