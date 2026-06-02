from fastapi import APIRouter, Depends

from auth.deps import UserContext, get_current_user
from schemas import MeResponse


router = APIRouter()


@router.get("/me", response_model=MeResponse)
def me(user: UserContext = Depends(get_current_user)) -> MeResponse:
    return MeResponse(
        tenant_id=user.tenant_id,
        user_id=user.user_id,
        email=user.email,
        name=user.name,
    )

