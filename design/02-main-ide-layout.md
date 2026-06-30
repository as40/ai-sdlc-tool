# Main IDE Layout
> Phase 6 (Stories 6.1–6.8) — Visual Workspace IDE & Live Code Editor

This is the primary workspace screen. Users spend 90% of their session here.

---

## Full IDE Layout (Story 6.1)

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ HEADER (48px fixed)                                                                       │
│ ◈ AI SDLC Tool  |  [acme/backend-api ▾]  [⎇ feature/auth-service ▾]  |  [●Auto] [●HITL] │
│                                                          [User avatar]  [Settings] [Docs] │
├──────────────────────────────────────────────────────────────────────────────────────────-┤
│ LEFT PANEL (240px)   │  CENTER STAGE (flex, min 480px)    │  RIGHT PANEL (320px)          │
│                      │                                    │                               │
│ [Jira] [Files]  tabs │  src/services/auth.service.ts  [×] │  GIT DIFF                    │
│ ─────────────────    │  ─────────────────────────────     │  ────────────────────────     │
│                      │                                    │  src/services/auth.service.ts │
│  JIRA VIEW           │   1  import { injectable } from    │  @@ -12,6 +15,18 @@           │
│  ─────────           │   2  'tsyringe';                   │                               │
│  Epic: Auth System ▾ │   3                                │  - export class AuthService { │
│                      │   4  @injectable()                 │  + @injectable()               │
│  ● 2.1 SSO Login     │   5  export class AuthService {   │  + export class AuthService { │
│  ● 2.2 JIT Provision │   6    constructor(               │  +   constructor(              │
│  ○ 2.3 RBAC          │   7      private db: Database,    │  +     private db: Database,  │
│  ○ 2.4 Workspace     │   8      private crypto: Crypto   │  +     private cfg: Config    │
│                      │   9    ) {}                        │  +   ) {}                     │
│  Attached to: 2.1    │  10                                │                               │
│  [Change story]      │  11    async validateToken(       │  ────────────────────────     │
│  ─────────────────   │  12      token: string            │  MUTATION TRACKER             │
│                      │  13    ): Promise<JWTPayload> {   │  ────────────────────────     │
│  FILE TREE           │  14      ...                      │  ● Modified (3 files)         │
│  ─────────           │  15    }                          │                               │
│  ▶ src/              │                                    │  M  auth.service.ts           │
│    ▶ services/       │   [AI is typing...]               │  M  auth.routes.ts            │
│    ▶ middleware/     │   ⟳  Adding validateToken impl.   │  A  jwt.utils.ts              │
│    ▶ routes/         │                                    │                               │
│    ▶ utils/          │                                    │  ─────────────────────────── │
│    ● auth.service.ts │                                    │  [✓ Approve All]  [✗ Discard] │
│    ● auth.routes.ts  │                                    │                               │
│  ▶ tests/            │                                    │  APPROVAL CONTROLS            │
│                      │                                    │  ─────────────────────────── │
│                      │                                    │  Mode:                        │
│                      │                                    │  ○ Auto   (write freely)      │
│                      │                                    │  ● HITL   (ask each step)     │
│                      │                                    │                               │
│                      │                                    │  [✓ Approve]  [✗ Reject]      │
│                      │                                    │  [✎ Edit & Approve]           │
│                      │                                    │                               │
├──────────────────────┴────────────────────────────────────┴───────────────────────────────┤
│ CHAT / TERMINAL (collapsible, default 280px)                                              │
│ ─────────────────────────────────────────────────────────────────────────────────────     │
│ [Chat] [Terminal] [Logs]                                            [Collapse ▲] [Clear]  │
│                                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐     │
│  │ 🤖  I've created the AuthService class with JWT validation. The service          │     │
│  │     uses dependency injection via tsyringe and validates the token signature     │     │
│  │     before returning the decoded payload. Should I add the refresh token        │     │
│  │     logic next?                                      [✓ Yes] [✗ No] [✎ Edit]   │     │
│  │                                                                                 │     │
│  │ 👤  /implement the refresh token endpoint too                                   │     │
│  │                                                                                 │     │
│  │ 🤖  ⟳ Planning refresh token endpoint...                                        │     │
│  └─────────────────────────────────────────────────────────────────────────────────┘     │
│                                                                                           │
│  ┌────────────────────────────────────────────────────────────── [Context +] [Send ↵] ┐  │
│  │ Type a message or /command...                                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Left Panel — Jira Tab Detail (Story 7.2 / 7.3)

```
┌──────────────────────────┐
│  [Jira]  [Files]         │
│  ─────────────────────   │
│  🔗 Connected: acme.jira │
│                          │
│  Project: BACKEND ▾      │
│                          │
│  ▾ Epic: Auth System     │
│    ● AUTH-12 SSO Login   │
│      [Attach to session] │
│    ● AUTH-13 JIT Prov.   │
│    ○ AUTH-14 RBAC        │
│    ○ AUTH-15 Workspace   │
│                          │
│  ▶ Epic: Git Operations  │
│  ▶ Epic: AI Sandbox      │
│                          │
│  ATTACHED CONTEXT        │
│  ─────────────────────   │
│  Story:  AUTH-12         │
│  Design: login-flow.fig  │
│  Docs:   auth-spec.md    │
│                          │
│  [+ Attach File/Design]  │
│                          │
└──────────────────────────┘
```

---

## Left Panel — File Tree Tab (Story 6.2)

```
┌──────────────────────────┐
│  [Jira]  [Files]         │
│  ─────────────────────   │
│  acme/backend-api        │
│  ─────────────────────   │
│  ▾ src/                  │
│    ▾ services/           │
│      ● auth.service.ts   │  ← modified (unsaved)
│        auth.test.ts      │
│      ▶ user.service.ts   │
│    ▾ middleware/         │
│      ● requireAuth.ts    │  ← modified
│      requireRole.ts      │
│    ▾ routes/             │
│      ● auth.routes.ts    │  ← modified
│      user.routes.ts      │
│    ▾ utils/              │
│      + jwt.utils.ts      │  ← new (untracked)
│      crypto.utils.ts     │
│    db/                   │
│    config.ts             │
│  ▶ tests/                │
│  package.json            │
│                          │
│  Legend:  ●=modified     │
│           +=new  -=del   │
│                          │
└──────────────────────────┘
```

---

## HITL Interceptor Dialog (Story 5.5)

```
┌─────────────────────────────────────────────────────┐
│  ⚠  Human Review Required                      [×]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  The AI wants to perform the following action:      │
│                                                     │
│  Action type: FILE_WRITE                            │
│  File: src/middleware/requireAuth.ts                │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ - export const requireAuth = (req, res, next│   │
│  │ -   const token = req.headers.auth;         │   │
│  │ + export const requireAuth: RequestHandler =│   │
│  │ +   const token = req.headers.authorization │   │
│  │ +     ?.replace('Bearer ', '');             │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  AI Reasoning:                                      │
│  "Using the full Authorization header with Bearer   │
│   prefix extraction matches RFC 6750 standard."     │
│                                                     │
│  [✗ Reject]   [✎ Edit]   [✓ Approve & Continue]    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Slash Command Palette (Story 6.7)

```
┌──────────────────────────────────────────────────────────┐
│  /                                                       │
│  ────────────────────────────────────────────────────    │
│  /implement <story>    Run full implementation          │
│  /review               Review current changes           │
│  /test                 Generate missing tests           │
│  /explain <selection>  Explain selected code            │
│  /context add <file>   Add file to AI context           │
│  /context clear        Reset AI context window          │
│  /branch <name>        Create feature branch            │
│  /pr                   Create pull request              │
│  /approve              Approve all pending changes      │
│  /discard              Discard all pending changes      │
│  /mode auto            Switch to Auto mode              │
│  /mode hitl            Switch to HITL mode              │
└──────────────────────────────────────────────────────────┘
```

---

## Bottom Panel Tabs

### Terminal Tab (Story 9.3)
```
┌────────────────────────────────────────────────────────────────┐
│ [Chat] [Terminal] [Logs]                       [Collapse ▲]    │
│ ─────────────────────────────────────────────────────────────  │
│ Sandbox: acme-backend-api (running)            [Kill] [Restart] │
│                                                                 │
│ $ npm run dev                                                   │
│ > backend@1.0.0 dev                                             │
│ > nodemon src/index.ts                                          │
│                                                                 │
│ [nodemon] starting `ts-node src/index.ts`                       │
│ ✓ Connected to PostgreSQL                                       │
│ ✓ Server running on port 3001                                   │
│ POST /api/auth/login  200  42ms                                 │
│ GET  /api/auth/me     401  3ms — Missing token                  │
│ _                                                               │
└────────────────────────────────────────────────────────────────┘
```

### Logs Tab (AI Execution Log)
```
┌────────────────────────────────────────────────────────────────┐
│ [Chat] [Terminal] [Logs]                       [Collapse ▲]    │
│ ─────────────────────────────────────────────────────────────  │
│ Session: AUTH-12 implementation  Tokens: 4,821  Cost: $0.031   │
│                                                                 │
│ 14:02:11  ● PLAN       Decomposed story into 6 subtasks        │
│ 14:02:14  ● FILE_READ  src/services/user.service.ts            │
│ 14:02:18  ● FILE_WRITE src/services/auth.service.ts (new)      │
│ 14:02:31  ● FILE_WRITE src/routes/auth.routes.ts (modified)    │
│ 14:02:45  ⚠ HITL       Awaiting approval: requireAuth.ts       │
│ 14:03:12  ✓ APPROVED   requireAuth.ts — by asoni764@gmail.com  │
│ 14:03:13  ● TOOL_CALL  run_tests                               │
│ 14:03:28  ✓ TESTS_PASS 8/8 tests passed                        │
└────────────────────────────────────────────────────────────────┘
```
