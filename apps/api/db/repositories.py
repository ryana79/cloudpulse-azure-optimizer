from collections.abc import Sequence
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from db.models import Anomaly, CostDaily, Finding, Subscription


def list_subscriptions(session: Session, tenant_id: str, user_id: str) -> Sequence[Subscription]:
    stmt = select(Subscription).where(
        Subscription.tenant_id == tenant_id, Subscription.user_id == user_id
    )
    return session.execute(stmt).scalars().all()


def get_cost_timeseries(
    session: Session, tenant_id: str, user_id: str, subscription_id: str
) -> Sequence[CostDaily]:
    stmt = (
        select(CostDaily)
        .where(
            CostDaily.tenant_id == tenant_id,
            CostDaily.user_id == user_id,
            CostDaily.subscription_id == subscription_id,
        )
        .order_by(CostDaily.date.asc())
    )
    return session.execute(stmt).scalars().all()


def list_findings(
    session: Session, tenant_id: str, user_id: str, subscription_id: str | None = None
) -> Sequence[Finding]:
    stmt = select(Finding).where(Finding.tenant_id == tenant_id, Finding.user_id == user_id)
    if subscription_id:
        stmt = stmt.where(Finding.subscription_id == subscription_id)
    return session.execute(stmt).scalars().all()


def get_finding(session: Session, tenant_id: str, user_id: str, finding_id: str) -> Finding | None:
    stmt = select(Finding).where(
        Finding.id == finding_id, Finding.tenant_id == tenant_id, Finding.user_id == user_id
    )
    return session.execute(stmt).scalars().first()


def list_anomalies(
    session: Session, tenant_id: str, user_id: str, subscription_id: str | None = None
) -> Sequence[Anomaly]:
    stmt = select(Anomaly).where(Anomaly.tenant_id == tenant_id, Anomaly.user_id == user_id)
    if subscription_id:
        stmt = stmt.where(Anomaly.subscription_id == subscription_id)
    return session.execute(stmt).scalars().all()


def get_anomaly(session: Session, tenant_id: str, user_id: str, anomaly_id: str) -> Anomaly | None:
    stmt = select(Anomaly).where(
        Anomaly.id == anomaly_id, Anomaly.tenant_id == tenant_id, Anomaly.user_id == user_id
    )
    return session.execute(stmt).scalars().first()


def list_cost_by_date(
    session: Session, tenant_id: str, user_id: str, subscription_id: str, target_date: date
) -> Sequence[CostDaily]:
    stmt = select(CostDaily).where(
        CostDaily.tenant_id == tenant_id,
        CostDaily.user_id == user_id,
        CostDaily.subscription_id == subscription_id,
        CostDaily.date == target_date,
    )
    return session.execute(stmt).scalars().all()

