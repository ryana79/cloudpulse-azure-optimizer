.PHONY: dev test lint ingest ingest-mock

dev:
	./scripts/dev.sh

test:
	cd apps/api && poetry run pytest

lint:
	cd apps/api && poetry run ruff check . && poetry run ruff format --check . && poetry run mypy .
	cd apps/web && npm run lint && npm run typecheck

ingest:
	cd apps/api && poetry run python ingest.py --subscriptions "$(SUBSCRIPTIONS)" --access-token "$(ACCESS_TOKEN)"

ingest-mock:
	cd apps/api && MOCK_MODE=1 poetry run python ingest.py --mock
