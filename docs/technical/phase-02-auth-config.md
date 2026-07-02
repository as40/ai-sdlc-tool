# Phase 02 — Auth & Config (Stories 2.0–2.5)

## Overview

Phase 2 implements all authentication paths (dev mock login, OIDC, SAML, JIT user provisioning), RBAC middleware, workspace CRUD + member management, AI provider configuration with encrypted key storage, and SSO provider configuration. The frontend gains an auth store (Zustand + localStorage), protected routes, and pages for workspaces, team management, AI config, and SSO settings.

## Authentication Flows

### Dev mock login

Only active when `NODE_ENV === 'development'`. The frontend `DevAuthPanel` component renders four buttons (one per role). Each calls:

```
POST /api/auth/mock-login
Content-Type: application/json

{ "role": "SUPER_ADMIN" | "WORKSPACE_OWNER" | "DEVELOPER" | "VIEWER", "email"?: string }
```

`AuthService.mockLogin` finds or creates a user in the `users` table (email defaults to `dev-<role>@localhost`) and signs an 8-hour JWT with `{ sub, email, role }`. Response:

```json
{ "token": "<jwt>" }
```

`DevAuthPanel` writes the token to `localStorage.auth_token` and calls `onLogin(token)`, which triggers `useAuthStore.setToken(token)`.

### OIDC flow

1. **Initiate** — Browser navigates (or `window.open`) to:

   ```
   GET /api/auth/oidc?workspaceId=<uuid>
   ```

   The controller loads the workspace's OIDC config from `sso_configurations` (decrypts it), stores `workspaceId` in the express-session under `ssoWorkspaceId`, registers a per-workspace passport strategy named `oidc-<workspaceId>`, and redirects the browser to the IdP's authorization endpoint.

2. **Callback** — IdP redirects to:

   ```
   GET /api/auth/oidc/callback
   ```

   The controller reads `ssoWorkspaceId` from session, reloads the strategy, and calls passport. On success, the OIDC profile is passed to `jitProvisioningMiddleware`. If provisioning succeeds:

   ```
   302 → <FRONTEND_URL>?token=<jwt>
   ```

   On error, it redirects to `<FRONTEND_URL>/login?error=<code>`.

3. **Frontend reads token** — `HomePage` in `App.tsx` detects `?token=` in `useSearchParams` and calls `setToken(token)`, which persists to localStorage and populates `useAuthStore`.

### SAML flow

Identical structure to OIDC:

1. `POST /api/auth/saml?workspaceId=<uuid>` — loads SAML config, registers `saml-<workspaceId>` strategy, initiates SP-initiated flow.
2. `POST /api/auth/saml/callback` — IdP posts assertion here; passport validates; `jitProvisioningMiddleware` runs; same `?token=` redirect on success.

### JIT provisioning

`jitProvisioningMiddleware` (`jit-provisioning.middleware.ts`) runs after every SSO callback. It calls `userRepository.upsert(profile)`:

- If the user exists and `deleted_at` is not null: calls `done(new JitProvisioningError('...', 403))`, triggering a `?error=account_disabled` redirect.
- If the user exists and `displayName` changed: updates the row.
- If the user exists and nothing changed: no-op.
- If the user does not exist: inserts a new row with `accessLevel: 'DEVELOPER'`.

The `isNew` flag is used only for structured logging (`jit_user_provisioned` vs `jit_user_login`).

### Token re-hydration on app refresh

`useAuthStore` initialises from `localStorage.getItem('auth_token')` at module load time. `parseJwt` base64-decodes the JWT payload and returns `{ sub, email, role, workspaceId? }` without signature verification (verification is the backend's responsibility). If no token is in storage, `user` and `token` are `null`.

## API Endpoints

| Method   | Path                                           | Auth       | Min Role          | Description                                      | Request body                                             | Response body                    |
| -------- | ---------------------------------------------- | ---------- | ----------------- | ------------------------------------------------ | -------------------------------------------------------- | -------------------------------- |
| `POST`   | `/api/auth/mock-login`                         | None       | —                 | Dev-only mock login                              | `{ role, email? }`                                       | `{ token }`                      |
| `GET`    | `/api/auth/oidc`                               | None       | —                 | Initiate OIDC; query: `workspaceId`              | —                                                        | 302 redirect                     |
| `GET`    | `/api/auth/oidc/callback`                      | None       | —                 | OIDC IdP callback                                | —                                                        | 302 redirect                     |
| `POST`   | `/api/auth/saml`                               | None       | —                 | Initiate SAML; query: `workspaceId`              | —                                                        | 302 redirect                     |
| `POST`   | `/api/auth/saml/callback`                      | None       | —                 | SAML IdP assertion post                          | SAMLResponse (form)                                      | 302 redirect                     |
| `GET`    | `/api/auth/sso/config`                         | Bearer JWT | `SUPER_ADMIN`     | Get SSO config; query: `workspaceId`, `provider` | —                                                        | `{ provider, config }`           |
| `POST`   | `/api/auth/sso/config`                         | Bearer JWT | `SUPER_ADMIN`     | Save SSO config; query: `workspaceId`            | `{ provider, config }`                                   | `{ message }`                    |
| `POST`   | `/api/workspaces`                              | Bearer JWT | `DEVELOPER`       | Create workspace                                 | `{ name }`                                               | Workspace record                 |
| `GET`    | `/api/workspaces`                              | Bearer JWT | `DEVELOPER`       | List workspaces for caller                       | —                                                        | `WorkspaceRecord[]`              |
| `GET`    | `/api/workspaces/:id`                          | Bearer JWT | `DEVELOPER`       | Get workspace (workspace-guard)                  | —                                                        | Workspace record                 |
| `POST`   | `/api/workspaces/:id/invites`                  | Bearer JWT | `WORKSPACE_OWNER` | Invite user by email                             | `{ email, role }`                                        | `WorkspaceMemberRecord`          |
| `DELETE` | `/api/workspaces/:id/members/:userId`          | Bearer JWT | `WORKSPACE_OWNER` | Remove member                                    | —                                                        | 204                              |
| `GET`    | `/api/workspaces/:id/settings`                 | Bearer JWT | `WORKSPACE_OWNER` | Settings stub                                    | —                                                        | `{ ok: true }`                   |
| `POST`   | `/api/workspaces/:id/ai-config`                | Bearer JWT | `WORKSPACE_OWNER` | Add AI config                                    | `{ provider, modelName, apiKey?, baseUrl?, isLocal }`    | `AIConfigRecord`                 |
| `GET`    | `/api/workspaces/:id/ai-config`                | Bearer JWT | `WORKSPACE_OWNER` | List AI configs                                  | —                                                        | `AIConfigRecord[]`               |
| `PUT`    | `/api/workspaces/:id/ai-config/:configId`      | Bearer JWT | `WORKSPACE_OWNER` | Update AI config                                 | `{ provider?, modelName?, apiKey?, baseUrl?, isLocal? }` | `AIConfigRecord`                 |
| `DELETE` | `/api/workspaces/:id/ai-config/:configId`      | Bearer JWT | `WORKSPACE_OWNER` | Delete AI config                                 | —                                                        | 204                              |
| `POST`   | `/api/workspaces/:id/ai-config/:configId/test` | Bearer JWT | `WORKSPACE_OWNER` | Test AI connection                               | —                                                        | `{ success, latencyMs, error? }` |
| `GET`    | `/api/admin/users`                             | Bearer JWT | `SUPER_ADMIN`     | Admin users stub                                 | —                                                        | `{ ok: true }`                   |
| `GET`    | `/api/admin/sso`                               | Bearer JWT | `SUPER_ADMIN`     | Admin SSO stub                                   | —                                                        | `{ ok: true }`                   |
| `GET`    | `/health`                                      | None       | —                 | Health check                                     | —                                                        | `{ status: "ok" }`               |

**Error shape (RFC 7807):**

```json
{ "status": 400, "title": "Validation Error", "detail": "<message>" }
```

**Invite request/response example:**

```json
// POST /api/workspaces/:id/invites
{ "email": "dev@example.com", "role": "DEVELOPER" }

// 201
{ "id": "...", "workspaceId": "...", "userId": "...", "accessLevel": "DEVELOPER", "createdAt": "..." }
```

**AI config create request example:**

```json
{ "provider": "Anthropic", "modelName": "claude-sonnet-4-6", "apiKey": "sk-...", "isLocal": false }
```

The `apiKey` is never returned in list/get responses; `AIConfigRecord` omits `api_key_encrypted`.

**SSO config save request (OIDC):**

```json
{
  "provider": "oidc",
  "config": {
    "clientId": "...",
    "clientSecret": "...",
    "issuer": "https://...",
    "authorizationUrl": "https://...",
    "tokenUrl": "https://...",
    "userInfoUrl": "https://...",
    "redirectUri": "https://..."
  }
}
```

**SSO config save request (SAML):**

```json
{
  "provider": "saml",
  "config": {
    "entryPoint": "https://...",
    "certificate": "-----BEGIN CERTIFICATE-----...",
    "issuer": "..."
  }
}
```

## Database Schema Changes

The `sso_configurations` table is the only new table introduced in Phase 2 (all others were scaffolded in Phase 1). See Phase 01 docs for full column definitions. Key behaviour unique to Phase 2: the entire OIDC or SAML config object is JSON-serialised and encrypted with `CryptoService` before being written to `config_encrypted`. It is decrypted on every read inside `SsoService`.

## RBAC

### Roles

| Role              | Numeric level | Effective permissions                                                                                      |
| ----------------- | ------------- | ---------------------------------------------------------------------------------------------------------- |
| `VIEWER`          | 0             | Read-only access to workspaces they are a member of                                                        |
| `DEVELOPER`       | 1             | Everything VIEWER can do plus create workspaces; default role for JIT-provisioned users                    |
| `WORKSPACE_OWNER` | 2             | Everything DEVELOPER can do plus manage members, AI configs, SSO configs, workspace settings               |
| `SUPER_ADMIN`     | 3             | Everything WORKSPACE_OWNER can do plus access all workspaces (bypasses membership check) plus admin routes |

### `requireAuth` middleware

File: `packages/backend/src/middleware/require-auth.middleware.ts`

Extracts the `Authorization: Bearer <token>` header. If absent or malformed, returns `401`. Otherwise verifies the JWT with `JWT_SECRET`. On success, attaches the decoded `JwtPayload` to `req.user` and calls `next()`. On invalid/expired token, returns `401`.

`JwtPayload` shape: `{ sub: string; email: string; role: UserRole; workspaceId?: string }`.

### `requireRole` middleware

File: `packages/backend/src/middleware/require-role.middleware.ts`

`requireRole(...roles: AccessLevel[])` returns a middleware that checks `req.user.role` against the provided list. This is an **exact-match** list, not a hierarchy check — the caller is responsible for listing all roles that are allowed. Returns `401` if `req.user` is absent, `403` if the role is not in the list.

Example: `requireRole('WORKSPACE_OWNER', 'SUPER_ADMIN')` allows both roles; `DEVELOPER` would be rejected.

### `workspaceGuard` middleware

File: `packages/backend/src/middleware/workspace-guard.middleware.ts`

Applied to all `/:id` workspace sub-routes. Reads `req.params.id` as the workspace ID.

- If `req.user.role === 'SUPER_ADMIN'`: verifies the workspace exists; skips membership check. Sets `req.workspaceId`.
- Otherwise: calls `workspaceRepository.findMember(workspaceId, user.sub)`. If no membership record is found, returns `403`. On success sets `req.workspaceId` and `req.workspaceMember`.

### `ProtectedRoute` component

File: `packages/frontend/src/components/auth/ProtectedRoute.tsx`

Props: `{ role: AccessLevel; children: ReactNode }`.

Reads `user` from `useAuthStore`. Compares `ROLE_LEVEL[user.role]` against `ROLE_LEVEL[props.role]`. If the user's level is lower than required, or the user is not logged in, renders `<Navigate to="/unauthorized" replace />`. Otherwise renders children.

Role levels used client-side match the backend ordering: `VIEWER=0`, `DEVELOPER=1`, `WORKSPACE_OWNER=2`, `SUPER_ADMIN=3`.

## Frontend Routes

| Path                                 | Component          | Min Role          | Notes                                                                             |
| ------------------------------------ | ------------------ | ----------------- | --------------------------------------------------------------------------------- |
| `/`                                  | `HomePage`         | None              | Shows `DevAuthPanel` in dev mode; reads `?token=` and `?error=` from query string |
| `/login`                             | `HomePage`         | None              | Alias for `/`; handles SSO callback `?error=` redirects                           |
| `/unauthorized`                      | `UnauthorizedPage` | None              | Shown by `ProtectedRoute` when access is denied                                   |
| `/workspaces/new`                    | `WorkspacePage`    | `DEVELOPER`       | Create workspace form                                                             |
| `/workspaces/:id/team`               | `TeamPage`         | `DEVELOPER`       | View members; invite/remove only if `WORKSPACE_OWNER` or `SUPER_ADMIN`            |
| `/workspaces/:id/settings/ai-config` | `AIConfigPage`     | `WORKSPACE_OWNER` | List/add/delete/test AI provider configs                                          |
| `/workspaces/:id/settings/sso`       | `SSOSettingsPage`  | `WORKSPACE_OWNER` | OIDC/SAML config form                                                             |

After login, `HomePage` auto-navigates:

- If the user has workspaces and is `WORKSPACE_OWNER`/`SUPER_ADMIN`: goes to `/workspaces/<first>/settings/ai-config`.
- If the user has workspaces and is `DEVELOPER`/`VIEWER`: goes to `/workspaces/<first>/team`.
- If the user has no workspaces and is `WORKSPACE_OWNER`/`SUPER_ADMIN`: goes to `/workspaces/new`.

## Frontend Components

### `DevAuthPanel`

File: `packages/frontend/src/components/dev/DevAuthPanel.tsx`

Props: `{ onLogin?: (token: string) => void }`.

Lazy-loaded only when `import.meta.env.DEV` is true (tree-shaken in production builds). Renders four buttons (Super Admin, Workspace Owner, Developer, Viewer). Clicking a button calls `POST /api/auth/mock-login` with the role, writes the token to `localStorage.auth_token`, and calls `onLogin(token)`. Displays a `FormMessage` on error. Uses the `warning` Button variant to visually flag it as dev-only.

### `ProtectedRoute`

See RBAC section above.

### `WorkspacePage`

File: `packages/frontend/src/pages/WorkspacePage.tsx`

Props: none (reads nothing from URL params).

Form with a single `name` input. On submit, calls `POST /api/workspaces` via `apiFetch`. On success, navigates to `/workspaces/<id>/settings/ai-config`. Uses `FormMessage` for errors.

### `TeamPage`

File: `packages/frontend/src/pages/TeamPage.tsx`

Props: `{ workspaceId: string }`.

Fetches workspace on load via `GET /api/workspaces/:id` to populate the member list. Renders each member's `userId` and `accessLevel`. Users with `WORKSPACE_OWNER` or `SUPER_ADMIN` role see:

- A "Remove" button per member (except their own entry, guarded by `m.userId !== user?.sub`).
- An invite form that calls `POST /api/workspaces/:id/invites` with `{ email, role }`. Role is limited to `DEVELOPER` or `VIEWER`. Uses `Alert` for error/success banners.

### `AIConfigPage`

File: `packages/frontend/src/pages/settings/AIConfigPage.tsx`

Props: none (reads `:id` from URL params).

Loads configs on mount via `GET /api/workspaces/:id/ai-config`. For each config, renders the provider, model name, a "local" badge if `isLocal`, and the optional `baseUrl`. Per-config actions:

- **Test**: `POST /api/workspaces/:id/ai-config/:configId/test` — displays latency or error inline below the row.
- **Delete**: `DELETE /api/workspaces/:id/ai-config/:configId` — removes from list on success.

Below the list, renders `AIConfigForm` to add a new config.

### `AIConfigForm`

File: `packages/frontend/src/components/settings/AIConfigForm.tsx`

Props: `{ workspaceId: string; token: string | null; onSuccess: () => void }`.

Controlled form. Providers: `Anthropic`, `OpenAI`, `Azure OpenAI`, `Custom/Local`. Selecting `Custom/Local` auto-sets `isLocal = true`. The base URL field is shown when `isLocal` is true or provider is `Azure OpenAI`. API key is required for cloud providers (client-side guard before submit). On success calls `onSuccess()` and resets form. Uses raw `fetch` with explicit `Authorization` header (not `apiFetch`).

### `SSOSettingsPage`

File: `packages/frontend/src/pages/settings/SSOSettingsPage.tsx`

Props: `{ workspaceId: string }`.

Tab switcher between `oidc` and `saml`. Renders `SSOConfigForm` for the active tab.

### `SSOConfigForm`

File: `packages/frontend/src/components/settings/SSOConfigForm.tsx`

Props: `{ workspaceId: string; provider: 'oidc' | 'saml'; onSaved?: () => void }`.

OIDC fields: `clientId`, `clientSecret` (password input), `issuer`, `authorizationUrl`, `tokenUrl`, `userInfoUrl`, `redirectUri` (pre-filled to `<window.location.origin>/api/auth/oidc/callback`).

SAML fields: `entryPoint`, `issuer`, `certificate` (Textarea, 6 rows, monospace).

On submit, calls `POST /api/auth/sso/config?workspaceId=...` with `{ provider, config }`. Shows `FormMessage` for error or success. "Test Connection" button opens `GET /api/auth/<provider>?workspaceId=...` in a popup window to test the live SSO flow.

## Shared Utilities

### `apiFetch`

File: `packages/frontend/src/utils/api-fetch.ts`

Wraps `fetch` with automatic auth injection. Reads the current token from `useAuthStore.getState()` (synchronous Zustand accessor, safe to call outside React). Sets `Authorization: Bearer <token>` if a token exists. On `401` response: calls `clearToken()` (removes `localStorage.auth_token`, nulls store state) and hard-navigates to `/` via `window.location.replace`. Returns a never-resolving `Promise` so callers do not process the response during navigation. Any non-401 response is passed through to the caller unchanged.

### `Alert` component

File: `packages/frontend/src/components/ui/alert.tsx`

Props: `{ variant: 'error' | 'success' | 'warning'; className?: string; children: ReactNode }`.

Renders a `<div role="alert">`. Variants:

- `error` — red border/background/text
- `success` — green border/background/text
- `warning` — yellow border/background/text

Use for page-level status messages (e.g. invite success, load errors).

### `FormMessage` component

File: `packages/frontend/src/components/ui/form-message.tsx`

Props: `{ variant?: 'error' | 'success'; className?: string; children: ReactNode }`.

Renders a `<p>` with `text-xs`. Default variant is `error` (red text). `success` variant renders green text. No background or border — intended for inline field-level feedback inside forms.

### `Button` component

File: `packages/frontend/src/components/ui/button.tsx`

Built with `cva` + Radix `Slot`. Variants: `default` (indigo), `outline` (zinc border), `destructive` (red border), `ghost` (no border), `warning` (yellow background). Sizes: `default` (`px-4 py-2`), `sm` (`px-2 py-1 text-xs`). Supports `asChild` for composition with other elements.

## Environment Variables

New variables introduced in Phase 2:

| Variable       | Required | Description                                                                           |
| -------------- | -------- | ------------------------------------------------------------------------------------- |
| `FRONTEND_URL` | No       | Base URL for SSO redirects. Falls back to `CORS_ORIGIN`, then `http://localhost:5173` |

The following Phase 1 variables are also used heavily in Phase 2:

| Variable         | Used by                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`     | `requireAuth`, `authenticateWsRequest`, `authService.mockLogin`, `signUserToken` in SSO controller |
| `ENCRYPTION_KEY` | `CryptoService` (encrypts SSO configs and AI API keys)                                             |
| `NODE_ENV`       | Mock-login availability guard (`=== 'development'` required)                                       |

## Key Files

```
packages/backend/src/modules/auth/auth.routes.ts           — Mounts mock-login and SSO sub-router
packages/backend/src/modules/auth/auth.controller.ts       — mockLoginController
packages/backend/src/modules/auth/auth.service.ts          — AuthService.mockLogin (find-or-create user, sign JWT)
packages/backend/src/modules/auth/auth.schemas.ts          — MockLoginSchema (Zod)
packages/backend/src/modules/auth/auth.types.ts            — JwtPayload, UserRole, AccessLevel types
packages/backend/src/modules/auth/sso.routes.ts            — OIDC/SAML initiate+callback routes + SSO config admin routes
packages/backend/src/modules/auth/sso.controller.ts        — oidcInitiateController, oidcCallbackController, samlInitiateController, samlCallbackController, getSsoConfigController, saveSsoConfigController
packages/backend/src/modules/auth/jit-provisioning.middleware.ts — jitProvisioningMiddleware, JitProvisioningError
packages/backend/src/modules/users/user.repository.ts      — UserRepository (findByEmail, upsert)
packages/backend/src/middleware/require-auth.middleware.ts  — requireAuth (JWT Bearer extraction + verification)
packages/backend/src/middleware/require-role.middleware.ts  — requireRole(...roles) factory
packages/backend/src/middleware/workspace-guard.middleware.ts — workspaceGuard (membership check + SUPER_ADMIN bypass)
packages/backend/src/modules/workspaces/workspace.routes.ts — Workspace CRUD, invite, remove-member, settings stub, ai-config sub-router mount
packages/backend/src/modules/workspaces/workspace.controller.ts — Five controllers for workspace operations
packages/backend/src/modules/workspaces/workspace.schemas.ts — createWorkspaceSchema, inviteMemberSchema (Zod)
packages/backend/src/modules/workspaces/workspace.service.ts — WorkspaceService (create, list, get, inviteUser, removeMember)
packages/backend/src/modules/ai-config/ai-config.routes.ts — CRUD + test routes for AI configurations
packages/backend/src/modules/ai-config/ai-config.schemas.ts — createAIConfigSchema, updateAIConfigSchema (Zod); PROVIDERS constant
packages/backend/src/modules/ai-config/ai-config.service.ts — AIConfigService (encrypt on write, decrypt on test)
packages/backend/src/modules/admin/admin.routes.ts          — /api/admin/users and /api/admin/sso stubs (SUPER_ADMIN only)
packages/backend/src/services/llm-gateway.service.ts       — LLMGateway.testConnection (stub; returns success immediately)
packages/frontend/src/App.tsx                              — BrowserRouter, all route definitions, HomePage (SSO token ingestion)
packages/frontend/src/store/auth.store.ts                  — useAuthStore (Zustand; token in localStorage; parseJwt)
packages/frontend/src/components/auth/ProtectedRoute.tsx   — Role-hierarchy guard; redirects to /unauthorized
packages/frontend/src/components/dev/DevAuthPanel.tsx      — Dev-only role-picker; lazy-loaded in DEV builds only
packages/frontend/src/utils/api-fetch.ts                   — apiFetch (auto-auth header; 401 → clearToken + redirect)
packages/frontend/src/pages/UnauthorizedPage.tsx           — Static 403 error page
packages/frontend/src/pages/WorkspacePage.tsx              — Create-workspace form
packages/frontend/src/pages/TeamPage.tsx                   — Member list, invite form, remove button
packages/frontend/src/pages/settings/AIConfigPage.tsx      — AI config list, test, delete, add-form wrapper
packages/frontend/src/pages/settings/SSOSettingsPage.tsx   — OIDC/SAML tab switcher
packages/frontend/src/components/settings/AIConfigForm.tsx — Controlled add-AI-config form
packages/frontend/src/components/settings/SSOConfigForm.tsx — Controlled OIDC/SAML config form with test-connection popup
packages/frontend/src/components/ui/alert.tsx              — Alert banner (error/success/warning variants)
packages/frontend/src/components/ui/form-message.tsx       — Inline form feedback <p> (error/success)
packages/frontend/src/components/ui/button.tsx             — Button (cva; default/outline/destructive/ghost/warning variants)
```

## Known Stubs / Forward References

- `LLMGateway.testConnection` always returns `{ success: true }` regardless of provider — real per-provider health checks are deferred to Phase 5.
- `GET /api/admin/users` and `GET /api/admin/sso` return `{ ok: true }` — full admin user management is a later phase.
- `GET /api/workspaces/:id/settings` returns `{ ok: true }` — workspace settings beyond AI config and SSO are not yet implemented.
- `TeamPage.loadMembers` calls `GET /api/workspaces/:id` and reads `data.members`, but the current `getWorkspaceController` returns only the workspace record without members. A later story will need to expand that response or add a dedicated members endpoint.
- `SSOConfigForm` does not load the existing saved config on mount — it always starts with empty fields. A future story should fetch and pre-populate via `GET /api/auth/sso/config`.
- `AIConfigForm` uses raw `fetch` instead of `apiFetch`, so the 401-auto-redirect behaviour does not apply to that form.
- `inviteMemberSchema` restricts role to `DEVELOPER` or `VIEWER` only — `WORKSPACE_OWNER` cannot be assigned via invite.
- passport strategies are registered globally on the shared `passport` instance and are keyed by workspace ID (`oidc-<id>`, `saml-<id>`). Each initiate/callback request re-registers the strategy, which is not thread-safe under high concurrency; this will need a per-request strategy pattern or a strategy cache in a future hardening story.
