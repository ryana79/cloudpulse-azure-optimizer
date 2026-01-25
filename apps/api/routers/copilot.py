from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy.orm import Session

from auth.deps import UserContext, get_current_user
from db.repositories import list_findings
from db.session import get_session
from providers.copilot import answer_question, build_context_pack, generate_remediation
from schemas import CopilotChatRequest, CopilotChatResponse, CopilotRemediateRequest, CopilotRemediateResponse
from utils.rate_limit import rate_limiter


router = APIRouter()


@router.post("/copilot/chat", response_model=CopilotChatResponse)
def copilot_chat(
    payload: CopilotChatRequest,
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CopilotChatResponse:
    if not rate_limiter.allow(f"copilot:{user.tenant_id}:{user.user_id}"):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")

    context_pack = build_context_pack(session, user.tenant_id, user.user_id, payload.subscription_id)
    try:
        result = answer_question(payload.question, context_pack)
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code if exc.response else 502
        detail = "Copilot provider rejected the request."
        if status_code in {401, 403}:
            detail = "Copilot provider authorization failed. Check GROK_API_KEY."
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Copilot provider request failed.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return CopilotChatResponse(
        answer=result.get("answer", ""),
        actions=result.get("actions", []),
        warnings=result.get("warnings", ["Never execute commands directly."]),
    )


@router.post("/copilot/remediate", response_model=CopilotRemediateResponse)
def copilot_remediate(
    payload: CopilotRemediateRequest,
    user: UserContext = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> CopilotRemediateResponse:
    if not rate_limiter.allow(f"copilot:{user.tenant_id}:{user.user_id}"):
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded")

    findings = list_findings(session, user.tenant_id, user.user_id)
    selected = [f for f in findings if f.id in payload.selected_findings]
    selected_payload = [
        {"id": f.id, "rule_id": f.rule_id, "title": f.title, "evidence": f.evidence}
        for f in selected
    ]
    try:
        result = generate_remediation(selected_payload, payload.format)
    except httpx.HTTPStatusError as exc:
        status_code = exc.response.status_code if exc.response else 502
        detail = "Copilot provider rejected the request."
        if status_code in {401, 403}:
            detail = "Copilot provider authorization failed. Check GROK_API_KEY."
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Copilot provider request failed.",
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    return CopilotRemediateResponse(
        script=result.get("script", ""),
        warnings=result.get("warnings", ["Never execute commands directly."]),
    )

