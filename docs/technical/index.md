# Technical Documentation Index

| Document                                           | Phases  | Summary                                                                                                                                         |
| -------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [phase-01-foundation.md](phase-01-foundation.md)   | 1.1–1.4 | Express app scaffold, full database schema, CryptoService (AES-256-GCM), WebSocket server with heartbeat and workspace rooms                    |
| [phase-02-auth-config.md](phase-02-auth-config.md) | 2.0–2.5 | Auth flows (mock dev login, OIDC, SAML, JIT provisioning), RBAC middleware stack, workspace CRUD + invite, AI provider config, SSO admin config |

## Quick reference

- Backend entry: `packages/backend/src/index.ts`
- Frontend entry: `packages/frontend/src/App.tsx`
- Schema files: `packages/backend/src/db/schema/`
- Environment variables: see the **Environment Variables** section in each phase doc
