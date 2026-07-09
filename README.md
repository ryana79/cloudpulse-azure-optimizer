# CloudPulse

[![CI](https://github.com/ryana79/cloudpulse-azure-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/ryana79/cloudpulse-azure-optimizer/actions/workflows/ci.yml)
[![CodeQL](https://github.com/ryana79/cloudpulse-azure-optimizer/actions/workflows/codeql.yml/badge.svg)](https://github.com/ryana79/cloudpulse-azure-optimizer/actions/workflows/codeql.yml)

CloudPulse is a multi-tenant Azure Cloud Optimization Dashboard. It uses Microsoft Entra ID for sign-in and delegates Azure access with OAuth2 On-Behalf-Of. Each tenant and user sees only their data.

## Architecture

```mermaid
flowchart LR
  subgraph Client
    WEB[Next.js + TypeScript + Tailwind<br/>MSAL sign-in, Recharts dashboards]
  end
  subgraph API["FastAPI Backend"]
    AUTH[Entra ID JWT validation<br/>+ OAuth2 On-Behalf-Of]
    ENGINE[Optimization Engine<br/>6 deterministic rules + z-score anomaly detection]
    COPILOT[Grok Copilot<br/>retrieval-grounded context packs]
    DB[(SQLAlchemy + Alembic<br/>SQLite / Postgres)]
  end
  subgraph Azure["Azure APIs (per-tenant, delegated)"]
    RG[Resource Graph]
    COST[Cost Management]
    MON[Monitor Metrics]
    ADV[Advisor]
  end
  WEB -->|Bearer token| AUTH
  AUTH -->|OBO token| RG & COST & MON & ADV
  RG & COST & MON & ADV --> DB
  DB --> ENGINE --> WEB
  DB --> COPILOT --> WEB
```

## Engineering Highlights

- **Multi-tenant identity done properly**: Entra ID sign-in with OAuth2 On-Behalf-Of delegation, so the backend accesses Azure strictly with each user's own permissions — no shared service credentials, and tenant data is isolated at the query layer.
- **Deterministic optimization engine**: 6 cost/hygiene rules (underutilized VMs, unattached disks, orphaned public IPs, stale snapshots, missing governance tags, Advisor ingestion) that emit structured findings with evidence and estimated savings.
- **Statistical anomaly detection**: rolling-window z-score detector over daily cost series with a minimum-spend floor to suppress noise on small subscriptions.
- **Tested where it counts**: the engine is covered by a 17-case pytest suite exercising thresholds, window boundaries, and severity/savings mapping — run it with `make test`.
- **CI hygiene**: GitHub Actions CI, CodeQL scanning, and Dependabot on every push.
- **Fixture-backed demo mode**: the full dashboard, anomaly, and copilot flows run against realistic Azure API fixtures with zero cloud credentials.

## Local Development

### Prereqs

- Python 3.11+
- Node.js 20+
- Poetry

### Setup

1) Create API env at `apps/api/.env` and web env at `apps/web/.env.local`.
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
- `k8s`: Kubernetes manifests for free/local clusters
- `docs`: architecture + security notes

## Staged Demo (No Sign-In)

You can run CloudPulse without any Microsoft sign-in:

1) Set `NEXT_PUBLIC_DEMO_MODE=1` in `apps/web/.env.local`.
2) Start the app (`make dev`) and open `/connect` or `/dashboard`.

The frontend will auto-enter demo mode and call the API with `X-Demo-Mode=1`, which triggers fixture-backed ingestion.

## Mock Mode (Signed In)

Set `MOCK_MODE=1` and use Demo Login on `/login`. This loads fixtures and populates the DB for dashboards, anomalies, and copilot.

## Kubernetes (Free Demo)

Minimal manifests are included under `k8s/` for local clusters (kind, k3d, minikube) or a single-node k3s VM.
See `k8s/README.md` for setup and notes.

## Helm (Free Demo)

A minimal Helm chart lives under `helm/cloudpulse` for the same local/demo clusters.

## Environment Variables (Frontend)

```
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/common
NEXT_PUBLIC_AZURE_REDIRECT_URI=http://localhost:3000/login
NEXT_PUBLIC_MOCK_MODE=0
NEXT_PUBLIC_DEMO_MODE=1
```

## Environment Variables (API)

Create `apps/api/.env`:

```
FRONTEND_ORIGIN=http://localhost:3000
DATABASE_URL=sqlite:///./cloudpulse.db
MOCK_MODE=0
DEMO_MODE=0
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=common
GROK_API_KEY=your-grok-key
GROK_MODEL=grok-4-latest
ENV=dev
```

## Dependency Locks

If `apps/api/poetry.lock` or `apps/web/package-lock.json` are placeholders, regenerate them with:

- `cd apps/api && poetry lock`
- `cd apps/web && npm install`

## Security

See `SECURITY.md` and `docs/threat-model-lite.md`.

## Production Checklist

See `docs/production-checklist.md` for deployment readiness steps.

