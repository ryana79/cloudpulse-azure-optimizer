# Production Config Checklist

## Required Env Vars (API)

- `ENV=prod`
- `MOCK_MODE=0`
- `AZURE_CLIENT_ID` (App registration Client ID)
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID=common`
- `FRONTEND_ORIGIN=https://your-domain`
- `DATABASE_URL=postgresql+psycopg://user:pass@host:5432/db`
- `GROK_API_KEY` and `GROK_MODEL` (optional)

## Required Env Vars (Web)

- `NEXT_PUBLIC_API_BASE=https://api.your-domain`
- `NEXT_PUBLIC_AZURE_CLIENT_ID` (same app registration Client ID)
- `NEXT_PUBLIC_AZURE_AUTHORITY=https://login.microsoftonline.com/common`
- `NEXT_PUBLIC_AZURE_REDIRECT_URI=https://your-domain/login`
- `NEXT_PUBLIC_MOCK_MODE=0`

## Entra ID App Registration

- Redirect URI: `https://your-domain/login`
- Supported account types: “Accounts in any organizational directory”
- API permissions: Azure Service Management → `user_impersonation` (delegated)
- Grant admin consent

## Database

- Provision Postgres
- Run migrations:
  - `cd apps/api && poetry run alembic upgrade head`

## Security Checks

- Confirm `ENV=prod` and `MOCK_MODE=0`
- Ensure CORS origin matches your frontend domain
- Rotate secrets before launch

