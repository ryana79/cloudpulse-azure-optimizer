from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_bearer_token, get_current_user
from azure.obo import acquire_obo_token
from azure.subscriptions import list_subscriptions
from config import settings
from db.session import get_session
from db.models import Subscription
from schemas import SubscriptionResponse
from services.mock_data import load_fixture


router = APIRouter()


@router.get("/subscriptions", response_model=list[SubscriptionResponse])
async def subscriptions(
    user: UserContext = Depends(get_current_user),
    token: str = Depends(get_bearer_token),
    session: Session = Depends(get_session),
) -> list[SubscriptionResponse]:
    if settings.mock_mode:
        fixtures = load_fixture("subscriptions.json")
        for sub in fixtures:
            session.merge(
                Subscription(
                    id=sub["subscription_id"],
                    tenant_id=user.tenant_id,
                    user_id=user.user_id,
                    display_name=sub["display_name"],
                )
            )
        session.commit()
        return [SubscriptionResponse(id=s["subscription_id"], display_name=s["display_name"]) for s in fixtures]

    obo_token = acquire_obo_token(token)
    azure_subs = await list_subscriptions(obo_token)
    results = []
    for sub in azure_subs:
        sub_id = sub.get("subscriptionId")
        if not sub_id:
            continue
        display = sub.get("displayName", sub_id)
        session.merge(
            Subscription(
                id=sub_id,
                tenant_id=user.tenant_id,
                user_id=user.user_id,
                display_name=display,
            )
        )
        results.append(SubscriptionResponse(id=sub_id, display_name=display))
    session.commit()
    return results

