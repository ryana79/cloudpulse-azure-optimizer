from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_current_user
from db.session import get_session
from schemas import SummaryResponse
from services.summary_service import build_summary


router = APIRouter()


@router.get("/summary", response_model=SummaryResponse)
def summary(
    subscription_id: str = Query(...),
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> SummaryResponse:
    data = build_summary(session, user.tenant_id, user.user_id, subscription_id)
    return SummaryResponse(**data)

