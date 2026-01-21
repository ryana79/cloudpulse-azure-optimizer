from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from app_logging import setup_logging
from db.base import Base
from db.session import engine
from routers import anomalies, copilot, cost, findings, health, ingest, me, subscriptions, summary


setup_logging(settings.log_level)

app = FastAPI(title="CloudPulse API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    Base.metadata.create_all(bind=engine)

