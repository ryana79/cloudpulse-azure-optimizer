# Security Policy

## Reporting a Vulnerability

Please open a private security advisory in GitHub or email security@cloudpulse.dev.

## Supported Versions

This project follows semantic versioning; only the latest release is supported.

## Secure Development Notes

- No secrets are committed to the repo.
- Tokens and keys must never be logged.
- OBO tokens are cached in memory only.
- Multi-tenant isolation enforced at DB query + code.

