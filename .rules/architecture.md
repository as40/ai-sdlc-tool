# Architecture Rules

## Layered Architecture (Backend)
```
Routes (HTTP boundary)
  └─ Middleware (auth, validation, rate-limit)
       └─ Controllers (thin — parse request, call service, return response)
            └─ Services (business logic — testable, framework-agnostic)
                 └─ Repositories (DB access only — no business logic)
                      └─ Database (Drizzle ORM + PostgreSQL)
```
- Controllers never access the DB directly.
- Services never touch `req`/`res` objects.
- Repositories never contain business logic — only parameterised queries.

## Module Organisation (Backend)
Each feature is a self-contained module folder:
```
src/modules/auth/
  auth.routes.ts
  auth.controller.ts
  auth.service.ts
  auth.repository.ts
  auth.schemas.ts      ← Zod schemas
  auth.types.ts        ← TypeScript interfaces
  __tests__/
    auth.service.test.ts
```

## Frontend Architecture
- Pages live in `src/pages/`. Each page is a thin component that composes smaller components.
- Reusable UI lives in `src/components/`. No business logic in components.
- Server state via React Query (`@tanstack/react-query`).
- Client-only UI state via Zustand stores in `src/store/`.
- API calls centralised in `src/api/` modules — never fetch from components directly.

## WebSocket Protocol
- Backend emits typed events: `{ type: string; payload: unknown }`.
- Frontend subscribes to specific event types via a `useWebSocket` hook.
- All WebSocket messages validated with Zod on receipt.

## Database Conventions
- Table names: snake_case plural (e.g., `workspace_members`).
- Column names: snake_case.
- Primary keys: UUID v7 (time-sortable).
- All tables include `created_at` and `updated_at` timestamps.
- Soft deletes via `deleted_at` nullable timestamp; never hard delete user data.
- All migrations are forward-only and idempotent.

## Agent / AI Architecture
- Agents are defined as markdown files in `src/agents/`.
- Skills are TypeScript functions in `src/skills/` with a matching JSON schema.
- Plugins are folder-based under `src/plugins/{tech-stack}/`.
- The Orchestrator Supervisor is the only component that calls the LLM API directly.
- All LLM calls go through the `LLMGateway` service — never call the SDK directly from business code.

## Multi-Tenancy
- Every DB query that accesses tenant data MUST filter by `workspace_id`.
- `workspace_id` comes from the authenticated JWT — never from the request body.
- The `workspaceGuard` middleware attaches `req.workspaceId` after verifying membership.
