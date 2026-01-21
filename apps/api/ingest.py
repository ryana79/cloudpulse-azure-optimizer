import argparse
import asyncio

from auth.deps import UserContext
from config import settings
from db.base import Base
from db.session import SessionLocal, engine
from services.ingest_service import ingest_mock, ingest_real


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="CloudPulse ingestion")
    parser.add_argument("--mock", action="store_true", help="Force mock ingestion")
    parser.add_argument("--subscriptions", type=str, default="", help="Comma-separated subscription IDs")
    parser.add_argument("--access-token", type=str, default="", help="User access token for OBO")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    Base.metadata.create_all(bind=engine)
    subscriptions = [s for s in args.subscriptions.split(",") if s] if args.subscriptions else None

    user = UserContext(
        tenant_id=settings.mock_tenant_id,
        user_id=settings.mock_user_id,
        email=settings.mock_user_email,
        name=settings.mock_user_name,
    )

    with SessionLocal() as session:
        if args.mock or settings.mock_mode:
            ingest_mock(session, user, subscriptions)
            return
        if not args.access_token or not subscriptions:
            raise SystemExit("Real ingestion requires --access-token and --subscriptions")
        asyncio.run(ingest_real(session, user, args.access_token, subscriptions))


if __name__ == "__main__":
    main()

