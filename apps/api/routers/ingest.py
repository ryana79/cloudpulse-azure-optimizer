from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_bearer_token, get_current_user, is_demo_request
from config import settings
from db.session import get_session
from schemas import IngestRequest, IngestResponse
from services.ingest_service import ingest_mock, ingest_real
from utils.rate_limit import rate_limiter


router = APIRouter()


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    payload: IngestRequest,
    user: UserContext = Depends(get_current_user),
    token: str = Depends(get_bearer_token),
    demo: bool = Depends(is_demo_request),
    session: Session = Depends(get_session),
) -> IngestResponse:
    if not rate_limiter.allow(f"ingest:{user.tenant_id}:{user.user_id}"):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")

    if settings.mock_mode or demo:
        run_id = ingest_mock(session, user, payload.subscription_ids or None)
    else:
        run_id = await ingest_real(session, user, token, payload.subscription_ids)
    return IngestResponse(run_id=run_id)

