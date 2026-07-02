# AI SDLC Tool — Claude Code Project Guide

## Project Overview

An AI agent-driven Software Development Lifecycle (SDLC) tool. Node.js/Express backend + React frontend monorepo with PostgreSQL/pgvector, WebSockets, Docker sandboxing, Jira integration, and a multi-agent orchestration engine.

## CRITICAL: Session Start Protocol

Execute these steps **in order** before writing a single line of code:

1. Read `STORY_TRACKER.md` — confirm which story is next; never start one already marked `DONE`.
2. `git checkout main && git pull origin main`
3. `pnpm install`
4. `git checkout -b feature/story-X.Y-<kebab-slug>`
5. Read the story file in `stories/phase-XX/`.
6. **Only now** begin implementation.

**The branch MUST exist before any source file is created or modified.** Writing code on the wrong branch and fixing it after (stash/pop) is error-prone and violates this workflow.

## Repository Structure

```
ai-sdlc-tool/
├── CLAUDE.md                    # This file
├── STORY_TRACKER.md             # Progress tracker — read first every session
├── .rules/                      # Engineering rules enforced on all code
│   ├── general.md
│   ├── security.md
│   ├── testing.md
│   └── architecture.md
├── stories/                     # One .md file per story
│   ├── phase-01/
│   ├── phase-02/
│   └── ...
├── packages/
│   ├── backend/                 # Node.js / Express
│   │   ├── src/
│   │   │   ├── agents/
│   │   │   ├── skills/
│   │   │   ├── workflows/
│   │   │   ├── prompts/
│   │   │   ├── standards/
│   │   │   ├── rules/
│   │   │   ├── plugins/
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   ├── services/
│   │   │   ├── db/
│   │   │   └── utils/
│   │   ├── tests/
│   │   └── package.json
│   └── frontend/                # React (Vite)
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── store/
│       │   └── utils/
│       ├── tests/
│       └── package.json
└── docker/
```

## Engineering Principles (Non-Negotiable)

### SOLID

- **S** — Every module/class has one reason to change.
- **O** — Extend via new files/classes; don't modify working code to add features.
- **L** — Subtypes are substitutable for their base types.
- **I** — Small, focused interfaces; never force callers to depend on unused methods.
- **D** — Depend on abstractions (interfaces/contracts), not concrete implementations.

### DRY

- Shared logic lives in `utils/` or `services/`. Never duplicate business logic across routes.
- Database query builders are centralised in `db/` repositories.

### Security (OWASP Top 10 + Project-Specific)

- All sensitive values (API keys, tokens) encrypted with AES-256-GCM before DB storage — never stored plaintext.
- JWT tokens validated on every protected route via `requireAuth` middleware.
- RBAC enforced via `requireRole(...)` middleware — never trust client-sent roles.
- All user input validated with Zod schemas at the route boundary.
- No `eval()`, no dynamic `require()` with user input, no shell injection vectors.
- SQL via parameterised queries only — never string-interpolated queries.
- Environment secrets loaded from `.env` — never committed to git.
- `helmet`, `cors` (whitelist only), and `rate-limiter-flexible` on all Express apps.
- CSRF protection on all state-mutating endpoints.

### Testing

- Every new backend service or utility **must** have a corresponding unit test file.
- Integration tests for all REST endpoints using Supertest.
- Frontend component tests with React Testing Library + Vitest.
- Target **≥90% coverage** on all new code. CI blocks merges below 80%.
- Test files live next to source (`*.test.ts`) or in `tests/` mirrors.

### Code Style

- TypeScript strict mode everywhere (`strict: true`).
- ESLint + Prettier enforced. No lint warnings suppressed without a comment explaining why.
- No `any` types — use `unknown` and narrow.
- Async/await over raw Promises; no unhandled rejections.
- Error responses follow RFC 7807 (`{ status, title, detail }`).

## Key Technology Choices

| Concern          | Choice                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| Backend          | Node.js 20 LTS, Express 5, TypeScript                                      |
| Frontend         | React 18, Vite, TypeScript, Tailwind CSS                                   |
| Database         | PostgreSQL 16 + pgvector                                                   |
| ORM              | Drizzle ORM (type-safe, no magic)                                          |
| Auth             | passport.js (OIDC + SAML), JWT (jsonwebtoken)                              |
| Validation       | Zod                                                                        |
| WebSockets       | ws library (native, no socket.io overhead)                                 |
| Testing (BE)     | Vitest + Supertest                                                         |
| Testing (FE)     | Vitest + React Testing Library                                             |
| Encryption       | Node.js `crypto` (AES-256-GCM)                                             |
| UI Components    | shadcn/ui (Radix UI + Tailwind — components owned in `src/components/ui/`) |
| Icons            | lucide-react                                                               |
| Resizable Panels | react-resizable-panels                                                     |
| Code Editor      | Monaco Editor                                                              |
| Container        | Docker + docker-compose                                                    |
| Package Manager  | pnpm workspaces                                                            |

## Story Workflow

1. Open `STORY_TRACKER.md` and pick the next `[ ] PENDING` story.
2. `git checkout main && git pull origin main`
3. `pnpm install` — ensure all dependencies are up to date before branching.
4. `git checkout -b feature/story-X.Y-<kebab-slug>`
5. Read the story file in `stories/phase-XX/`.
6. Implement, write tests, lint, verify.
7. Run `pnpm coverage` and confirm line coverage is ≥80% before proceeding.
8. Commit all changes to the feature branch.
9. Mark the story `[x] DONE` in `STORY_TRACKER.md` with the completion date.
10. Update `STORY_TRACKER.md` "Last Updated" field.
11. Update `docs/technical/phase-XX-<slug>.md` with what was built: API endpoints, schema changes, frontend routes/components, new env vars, and any stubs introduced. Create the file if it does not exist for this phase. Also update `docs/technical/index.md`.
12. Update `README.md` **only** if the story introduced something a developer needs to run the project: a new required env var, a new external service, a new CLI command, or a new dependency that requires manual setup. Do **not** add story titles, changelogs, or feature descriptions to the README.

## Design References

Wireframe ASCII mockups live in `design/` — one file per screen group. **Read the relevant design file before implementing any Phase 6+ (UI) story.**

## Commands (once scaffolded)

```bash
# Install all dependencies
pnpm install

# Run backend dev server
pnpm --filter backend dev

# Run frontend dev server
pnpm --filter frontend dev

# Run all tests
pnpm test

# Run linter
pnpm lint

# Database migrations
pnpm --filter backend db:migrate
```
