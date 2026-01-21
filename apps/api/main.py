from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from app_logging import setup_logging
from db.base import Base
from db.session import engine
from routers import anomalies, copilot, cost, findings, health, ingest, me, subscriptions, summary
from utils.rate_limit import rate_limiter


setup_logging(settings.log_level)

app = FastAPI(title="CloudPulse API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def global_rate_limit(request: Request, call_next):
    client_host = request.client.host if request.client else "unknown"
    key = f"global:{client_host}:{request.url.path}"
    if not rate_limiter.allow(key):
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": "Rate limit exceeded"},
        )
    return await call_next(request)

app.include_router(health.router)
app.include_router(me.router)
app.include_router(subscriptions.router)
app.include_router(ingest.router)
app.include_router(summary.router)
app.include_router(cost.router)
app.include_router(anomalies.router)
app.include_router(findings.router)
app.include_router(copilot.router)


@app.on_event("startup")
def startup() -> None:
    if settings.environment.lower() in {"prod", "production"}:
        if settings.mock_mode:
            raise RuntimeError("MOCK_MODE cannot be enabled in production")
        if not settings.azure_client_id or not settings.azure_client_secret:
            raise RuntimeError("Azure client credentials must be set in production")
    Base.metadata.create_all(bind=engine)

