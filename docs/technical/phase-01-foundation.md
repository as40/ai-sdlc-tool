# Phase 01 — Foundation (Stories 1.1–1.4)

## Overview

Phase 1 establishes the monorepo skeleton (pnpm workspaces), the Express 5 application with security middleware, the full Drizzle ORM schema for all core entities, a CryptoService for AES-256-GCM encryption, and a WebSocket server with JWT authentication, heartbeat, and per-workspace fan-out. Nothing in this phase is user-facing; it is purely infrastructure that later phases build on.

## Database Schema

All primary keys use UUIDv7 (monotonically sortable). Timestamps are stored `WITH TIME ZONE`. Soft-delete columns (`deleted_at`) are present where noted but no hard-delete logic was added in this phase.

### Enums (`packages/backend/src/db/schema/enums.ts`)

| Enum name (PG)    | Values                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `access_level`    | `SUPER_ADMIN`, `WORKSPACE_OWNER`, `DEVELOPER`, `VIEWER`                   |
| `workflow_status` | `IDLE`, `RUNNING`, `AWAITING_APPROVAL`, `REVISION_REQUESTED`, `COMPLETED` |

A second enum, `sso_provider` (`oidc`, `saml`), is defined in `sso-configurations.ts` rather than the shared enums file.

### `users`

| Column         | Type           | Constraints                                      |
| -------------- | -------------- | ------------------------------------------------ |
| `id`           | `uuid`         | PK, default `uuidv7()`                           |
| `email`        | `varchar(255)` | NOT NULL, UNIQUE                                 |
| `display_name` | `varchar(255)` | NOT NULL                                         |
| `access_level` | `access_level` | NOT NULL, default `DEVELOPER`                    |
| `created_at`   | `timestamptz`  | NOT NULL, default `now()`                        |
| `updated_at`   | `timestamptz`  | NOT NULL, default `now()`, auto-updated on write |
| `deleted_at`   | `timestamptz`  | nullable (soft-delete sentinel)                  |

### `workspaces`

| Column       | Type           | Constraints                                  |
| ------------ | -------------- | -------------------------------------------- |
| `id`         | `uuid`         | PK, default `uuidv7()`                       |
| `name`       | `varchar(255)` | NOT NULL                                     |
| `owner_id`   | `uuid`         | NOT NULL, FK → `users.id` ON DELETE RESTRICT |
| `created_at` | `timestamptz`  | NOT NULL, default `now()`                    |
| `updated_at` | `timestamptz`  | NOT NULL, auto-updated                       |
| `deleted_at` | `timestamptz`  | nullable                                     |

### `workspace_members`

| Column         | Type           | Constraints                                       |
| -------------- | -------------- | ------------------------------------------------- |
| `id`           | `uuid`         | PK, default `uuidv7()`                            |
| `workspace_id` | `uuid`         | NOT NULL, FK → `workspaces.id` ON DELETE RESTRICT |
| `user_id`      | `uuid`         | NOT NULL, FK → `users.id` ON DELETE RESTRICT      |
| `access_level` | `access_level` | NOT NULL, default `DEVELOPER`                     |
| `created_at`   | `timestamptz`  | NOT NULL, default `now()`                         |

Unique constraint: `uniq_workspace_member` on `(workspace_id, user_id)`.

### `ai_configurations`

| Column              | Type           | Constraints                                       |
| ------------------- | -------------- | ------------------------------------------------- |
| `id`                | `uuid`         | PK, default `uuidv7()`                            |
| `workspace_id`      | `uuid`         | NOT NULL, FK → `workspaces.id` ON DELETE RESTRICT |
| `provider`          | `varchar(100)` | NOT NULL                                          |
| `model_name`        | `varchar(255)` | NOT NULL                                          |
| `api_key_encrypted` | `text`         | nullable                                          |
| `base_url`          | `text`         | nullable                                          |
| `is_local`          | `boolean`      | NOT NULL, default `false`                         |
| `created_at`        | `timestamptz`  | NOT NULL, default `now()`                         |
| `updated_at`        | `timestamptz`  | NOT NULL, auto-updated                            |

### `sso_configurations`

| Column             | Type           | Constraints                                      |
| ------------------ | -------------- | ------------------------------------------------ |
| `id`               | `uuid`         | PK, default `uuidv7()`                           |
| `workspace_id`     | `uuid`         | NOT NULL, FK → `workspaces.id` ON DELETE CASCADE |
| `provider`         | `sso_provider` | NOT NULL (`oidc` or `saml`)                      |
| `config_encrypted` | `text`         | NOT NULL                                         |
| `created_at`       | `timestamptz`  | NOT NULL, default `now()`                        |
| `updated_at`       | `timestamptz`  | NOT NULL, auto-updated                           |

Unique constraint: `uniq_sso_workspace_provider` on `(workspace_id, provider)`.

### `repositories`

| Column         | Type           | Constraints                                       |
| -------------- | -------------- | ------------------------------------------------- |
| `id`           | `uuid`         | PK, default `uuidv7()`                            |
| `workspace_id` | `uuid`         | NOT NULL, FK → `workspaces.id` ON DELETE RESTRICT |
| `name`         | `varchar(255)` | NOT NULL                                          |
| `remote_url`   | `text`         | NOT NULL                                          |
| `is_primary`   | `boolean`      | NOT NULL, default `false`                         |
| `local_path`   | `text`         | nullable                                          |
| `tech_stack`   | `jsonb`        | nullable                                          |
| `created_at`   | `timestamptz`  | NOT NULL, default `now()`                         |
| `updated_at`   | `timestamptz`  | NOT NULL, auto-updated                            |

### `workflow_executions`

| Column          | Type              | Constraints                                       |
| --------------- | ----------------- | ------------------------------------------------- |
| `id`            | `uuid`            | PK, default `uuidv7()`                            |
| `workspace_id`  | `uuid`            | NOT NULL, FK → `workspaces.id` ON DELETE RESTRICT |
| `session_id`    | `uuid`            | nullable                                          |
| `status`        | `workflow_status` | NOT NULL, default `IDLE`                          |
| `jira_story_id` | `varchar(100)`    | nullable                                          |
| `started_at`    | `timestamptz`     | nullable                                          |
| `completed_at`  | `timestamptz`     | nullable                                          |
| `created_at`    | `timestamptz`     | NOT NULL, default `now()`                         |
| `updated_at`    | `timestamptz`     | NOT NULL, auto-updated                            |

## Backend Services

### CryptoService

File: `packages/backend/src/utils/crypto.service.ts`

Algorithm: **AES-256-GCM** (`aes-256-gcm`).

| Method                        | Input         | Output        | Notes                                                       |
| ----------------------------- | ------------- | ------------- | ----------------------------------------------------------- |
| `encrypt(plaintext: string)`  | UTF-8 string  | base64 string | Throws `CryptoError` on empty input                         |
| `decrypt(ciphertext: string)` | base64 string | UTF-8 string  | Throws `CryptoError` if data is too short or auth tag fails |

Wire format for the base64 blob: `[16 bytes IV][16 bytes GCM auth tag][N bytes ciphertext]`, all concatenated and then base64-encoded. The key is read from `ENCRYPTION_KEY` at call time (not constructor time), must be exactly 64 hex characters (32 bytes).

A singleton `cryptoService` is exported for use across services.

### WebSocket Server

File: `packages/backend/src/websocket/ws.service.ts`

The `WebSocketService` wraps the `ws` library's `WebSocketServer` and attaches it to the Node.js `http.Server` created in `index.ts`.

**Authentication**: On each new connection `authenticateWsRequest` (`ws.middleware.ts`) is called. It accepts the JWT either as a `Bearer` token in the `Authorization` header or as a `?token=` query-string parameter on the WebSocket upgrade URL. The JWT is verified with `JWT_SECRET`. Claims read: `sub`/`userId` (required), `workspaceId` (optional). A connection that fails auth is closed with code `4401`.

**Connection tracking**: Two in-memory maps are maintained:

- `userConnections: Map<userId, Set<ExtendedWebSocket>>` — one user may hold multiple connections
- `workspaceUsers: Map<workspaceId, Set<userId>>` — used for workspace-scoped broadcasts

**Heartbeat**: Every 30 seconds (configurable), the server pings all open sockets. Any socket that did not respond with `pong` since the last heartbeat is terminated.

**Incoming message handling**: Messages are JSON-parsed and validated with `IncomingMessageSchema` (requires `{ type: string, payload?: unknown }`). Only `type: "ping"` is handled — it receives a `pong` response.

**Outbound event types** (`packages/backend/src/types/ws-events.ts`):

| Event type               | Payload                                                   |
| ------------------------ | --------------------------------------------------------- |
| `pong`                   | `{}`                                                      |
| `error`                  | `{ message: string }`                                     |
| `workflow:update`        | `{ workflowId: string; status: string; detail?: string }` |
| `vectorization:progress` | `{ progress: number; repositoryId: string }`              |
| `container:log`          | `{ line: string; stream: 'stdout' \| 'stderr' }`          |

All events carry a `timestamp` (ISO 8601 string). The helper `makeEvent(type, payload)` stamps the timestamp at creation time.

**Broadcast API** (used by services in later phases):

- `broadcast(userId, event)` — sends to all open sockets for one user
- `broadcastToWorkspace(workspaceId, event)` — sends to all members in that workspace

**Shutdown**: `close()` terminates all connections, clears both maps, and returns a Promise that resolves when the underlying `WebSocketServer` is closed.

## Environment Variables

| Variable         | Required | Default                 | Description                                                  |
| ---------------- | -------- | ----------------------- | ------------------------------------------------------------ |
| `PORT`           | No       | `3001`                  | HTTP/WS listen port                                          |
| `NODE_ENV`       | No       | `development`           | Controls cookie secure flag and mock-login availability      |
| `DATABASE_URL`   | Yes      | —                       | PostgreSQL connection string (used by Drizzle)               |
| `JWT_SECRET`     | Yes      | —                       | Signing secret for JWTs; also used as express-session secret |
| `ENCRYPTION_KEY` | Yes      | —                       | 64-character hex string (32 bytes) for AES-256-GCM           |
| `CORS_ORIGIN`    | No       | `http://localhost:5173` | Allowed CORS origin; also fallback for `FRONTEND_URL`        |

## Key Files

```
packages/backend/src/index.ts               — HTTP server + WebSocket bootstrap; SIGTERM handler
packages/backend/src/app.ts                 — Express app factory: helmet, cors, session, passport, routes
packages/backend/src/config.ts              — Typed config object read from process.env
packages/backend/src/db/schema/enums.ts     — Shared Drizzle pgEnums (access_level, workflow_status)
packages/backend/src/db/schema/users.ts     — users table definition
packages/backend/src/db/schema/workspaces.ts — workspaces table definition
packages/backend/src/db/schema/workspace-members.ts — workspace_members table with unique constraint
packages/backend/src/db/schema/ai-configurations.ts — ai_configurations table (encrypted key column)
packages/backend/src/db/schema/sso-configurations.ts — sso_configurations table (encrypted config column)
packages/backend/src/db/schema/repositories.ts — repositories table (jsonb tech_stack)
packages/backend/src/db/schema/workflow-executions.ts — workflow_executions table
packages/backend/src/utils/crypto.service.ts — CryptoService class + cryptoService singleton
packages/backend/src/utils/errors.ts        — AppError and CryptoError base classes
packages/backend/src/websocket/ws.service.ts — WebSocketService (connection tracking, heartbeat, broadcast)
packages/backend/src/websocket/ws.middleware.ts — authenticateWsRequest (JWT from header or ?token=)
packages/backend/src/websocket/ws.events.ts — IncomingMessageSchema (Zod)
packages/backend/src/types/ws-events.ts     — WsEvent discriminated union + makeEvent helper
```

## Known Stubs / Forward References

- `repositories` and `workflow_executions` tables are defined in the schema but have no routes, repositories, or services yet. They are placeholders for Phase 3 (repository ingestion) and Phase 4/5 (agent orchestration).
- `workflow_executions.session_id` has no FK constraint — the `sessions` table does not exist yet.
- `LLMGateway.testConnection` always returns `{ success: true, latencyMs: <elapsed> }` with no real provider call. Phase 5 implements real health checks.
- `GET /api/admin/users` and `GET /api/admin/sso` return `{ ok: true }` stubs.
- `GET /api/workspaces/:id/settings` returns `{ ok: true }` stub.
