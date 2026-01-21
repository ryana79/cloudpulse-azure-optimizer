from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from config import settings


def _build_engine():
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    return create_engine(settings.database_url, connect_args=connect_args, future=True)


engine = _build_engine()
SessionLocal = sessionmaker(bind=engine, class_=Session, expire_on_commit=False, future=True)


def get_session() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

