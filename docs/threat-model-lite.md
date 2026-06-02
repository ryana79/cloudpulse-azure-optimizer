# Threat Model Lite

## Assets

- Azure subscription data
- Copilot context packs and responses
- Tenant and user identifiers

## Trust Boundaries

- Browser ↔ API (bearer tokens only)
- API ↔ Microsoft identity platform (token validation + OBO)
- API ↔ Azure APIs (delegated access)

## Key Threats + Mitigations

- Token theft: no localStorage token persistence; no token logging; short-lived access.
- Tenant data leaks: enforce tenant_id + user_id filters in every query.
- Prompt injection: treat data as untrusted; ignore instructions inside data.
- Abuse: rate limiting on chat and ingest endpoints.

## CSRF Strategy

The API uses bearer tokens and does not rely on cookies for auth. CSRF is mitigated by not using cookie-based sessions. If cookies are introduced later, use same-site cookies or double-submit tokens.

