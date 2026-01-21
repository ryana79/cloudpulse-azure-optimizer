# CloudPulse

[![CI](https://github.com/your-org/cloudpulse/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/cloudpulse/actions/workflows/ci.yml)
[![CodeQL](https://github.com/your-org/cloudpulse/actions/workflows/codeql.yml/badge.svg)](https://github.com/your-org/cloudpulse/actions/workflows/codeql.yml)

CloudPulse is a multi-tenant Azure Cloud Optimization Dashboard. It uses Microsoft Entra ID for sign-in and delegates Azure access with OAuth2 On-Behalf-Of. Each tenant and user sees only their data.

## Highlights

- FastAPI backend with SQLAlchemy + Alembic
- Next.js + TypeScript + Tailwind + Recharts frontend
- Multi-tenant Microsoft identity platform auth
- Deterministic optimization engine + anomaly detection
- Grok-powered Copilot with retrieval-grounded context packs
- Robust mock mode for demos

## Local Development

### Prereqs

- Python 3.11+
- Node.js 20+
- Poetry

### Setup

1) Copy `.env.example` to `.env` and fill values.
2) Install deps:
   - `cd apps/api && poetry install`
   - `cd apps/web && npm install`
3) Run:
   - `make dev`

### Tests + Lint

- `make test`
- `make lint`

### Ingestion

- Real ingestion: `make ingest`
- Mock ingestion: `make ingest-mock`

## Repo Layout

- `apps/api`: FastAPI backend, Azure OBO, engine, DB
- `apps/web`: Next.js frontend
- `docs`: architecture + security notes

## Mock Mode

Set `MOCK_MODE=1` and use Demo Login on `/login`. This loads fixtures and populates the DB for dashboards, anomalies, and copilot.

## Environment Variables (Frontend)

```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/common
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000/login
NEXT_PUBLIC_MOCK_MODE=1
```

## Dependency Locks

If `apps/api/poetry.lock` or `apps/web/package-lock.json` are placeholders, regenerate them with:

- `cd apps/api && poetry lock`
- `cd apps/web && npm install`

## GitHub Repo Creation + Push

1) Create a new GitHub repo (no README, no .gitignore).
2) Run the init script:

```
./scripts/init_repo.sh
```

3) Push:

```
git push -u origin main
```

## Security

See `SECURITY.md` and `docs/threat-model-lite.md`.

