# AI SDLC Tool

An AI agent-driven Software Development Lifecycle tool. Pairs a Node.js/Express backend with a React frontend in a pnpm monorepo, backed by PostgreSQL + pgvector, real-time WebSockets, Docker sandboxing, Jira integration, and a multi-agent orchestration engine.

---

## Prerequisites

| Tool                    | Version         | Install                          |
| ----------------------- | --------------- | -------------------------------- |
| Node.js                 | ≥ 20.0.0        | [nodejs.org](https://nodejs.org) |
| pnpm                    | ≥ 9.0.0         | `npm install -g pnpm`            |
| Docker & Docker Compose | Latest          | [docker.com](https://docker.com) |
| PostgreSQL              | 16 (via Docker) | included in `docker-compose.yml` |

---

## Tech Stack

| Concern         | Choice                                                       |
| --------------- | ------------------------------------------------------------ |
| Backend         | Node.js 20 LTS, Express 5, TypeScript                        |
| Frontend        | React 18, Vite, TypeScript, Tailwind CSS                     |
| Database        | PostgreSQL 16 + pgvector                                     |
| ORM             | Drizzle ORM                                                  |
| Auth            | passport.js (OIDC + SAML), JWT                               |
| Validation      | Zod                                                          |
| WebSockets      | ws (native)                                                  |
| UI Components   | shadcn/ui (Radix UI + Tailwind)                              |
| Testing         | Vitest + Supertest (BE), Vitest + React Testing Library (FE) |
| Container       | Docker + docker-compose                                      |
| Package Manager | pnpm workspaces                                              |

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd ai-sdlc-tool
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example env file and fill in the required values:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Minimum required values for local development:

```env
PORT=3001
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_sdlc_dev
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=ai_sdlc_dev
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

JWT_SECRET=your-secret-at-least-32-chars
JWT_EXPIRES_IN=7d

ENCRYPTION_KEY=your-32-byte-hex-key

CORS_ORIGIN=http://localhost:5173
```

Generate a secure `ENCRYPTION_KEY` (must be exactly 32 bytes hex-encoded):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 16 with pgvector on port `5432`. Wait for the healthcheck to pass before running migrations.

### 5. Run database migrations

```bash
pnpm --filter backend db:migrate
```

---

## Running the Project

### Run everything (backend + frontend in parallel)

```bash
pnpm dev
```

### Run backend only

```bash
pnpm --filter backend dev
```

Backend runs at `http://localhost:3001`
WebSocket server runs at `ws://localhost:3001`

### Run frontend only

```bash
pnpm --filter frontend dev
```

Frontend runs at `http://localhost:5173`

---

## Testing

```bash
# Run all tests (backend + frontend)
pnpm test

# Run backend tests only
pnpm --filter backend test

# Run frontend tests only
pnpm --filter frontend test
```

Coverage target: ≥90% on all new code. CI blocks merges below 80%.

---

## Linting & Type Checking

```bash
# Lint all packages
pnpm lint

# Type-check all packages
pnpm type-check
```

---

## Database Commands

```bash
# Generate a new migration from schema changes
pnpm --filter backend db:generate

# Apply pending migrations
pnpm --filter backend db:migrate

# Open Drizzle Studio (DB browser)
pnpm --filter backend db:studio

# Seed the database
pnpm --filter backend db:seed
```

---

## Project Structure

```
ai-sdlc-tool/
├── packages/
│   ├── backend/                 # Node.js / Express API
│   │   ├── src/
│   │   │   ├── agents/          # AI agent definitions
│   │   │   ├── skills/          # MCP skill modules
│   │   │   ├── workflows/       # State-machine orchestration
│   │   │   ├── prompts/         # System prompt templates
│   │   │   ├── routes/          # Express route handlers
│   │   │   ├── middleware/      # Auth, RBAC, validation
│   │   │   ├── services/        # Business logic layer
│   │   │   ├── db/              # Drizzle schema + migrations
│   │   │   ├── websocket/       # WebSocket server
│   │   │   └── utils/           # Shared utilities (crypto, etc.)
│   │   └── tests/
│   └── frontend/                # React / Vite SPA
│       ├── src/
│       │   ├── components/      # Shared UI components (shadcn/ui)
│       │   ├── pages/           # Route-level page components
│       │   ├── hooks/           # Custom React hooks
│       │   ├── store/           # Global state
│       │   └── utils/           # Frontend utilities
│       └── tests/
├── docker-compose.yml           # PostgreSQL + pgvector
├── stories/                     # Feature story specs (phase-XX/)
├── design/                      # ASCII wireframe mockups
├── STORY_TRACKER.md             # Implementation progress
└── CLAUDE.md                    # AI agent project guide
```

---

## Development Workflow

1. Read `STORY_TRACKER.md` to pick the next pending story.
2. Pull latest main and install dependencies:
   ```bash
   git checkout main && git pull origin main
   pnpm install
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/story-X.Y-<kebab-slug>
   ```
4. Implement the story with tests (≥90% coverage).
5. Lint and type-check before committing:
   ```bash
   pnpm lint && pnpm type-check
   ```
6. Commit and open a PR against `main`.

---

## Implemented Features

### Phase 1 — Foundation & Platform Scaffolding

| Story | Title                                    | Status |
| ----- | ---------------------------------------- | ------ |
| 1.1   | Initialize Monorepo & Engine Directories | Done   |
| 1.2   | Setup PostgreSQL & pgvector Database     | Done   |
| 1.3   | Secure Cryptography Utility Setup        | Done   |
| 1.4   | WebSocket Server Implementation          | Done   |

---

## Security Notes

- All secrets must be stored in `packages/backend/.env` — never committed to git.
- `ENCRYPTION_KEY` must be a cryptographically random 32-byte hex string.
- JWT tokens expire in 7 days by default; adjust `JWT_EXPIRES_IN` as needed.
- CORS is locked to `CORS_ORIGIN` — update this for staging/production deployments.
