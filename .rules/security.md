# Security Rules (OWASP Top 10 + Project-Specific)

## Authentication & Authorization
- Every protected route MUST go through `requireAuth` middleware (JWT verification).
- RBAC is enforced via `requireRole('ROLE')` middleware at the route level — never inline.
- JWT secrets must be at least 64 random bytes, stored in `.env`, rotated on breach.
- JWT expiry: access tokens 15 minutes, refresh tokens 7 days.
- Never store sensitive data in JWT payload (only userId, role, workspaceId).

## Input Validation (A03 — Injection)
- ALL incoming request bodies, query params, and route params validated with Zod at the route boundary.
- Zod schemas live in a co-located `schemas/` directory.
- Never interpolate user input into SQL strings — use Drizzle ORM parameterised queries exclusively.
- Never pass user input to `child_process.exec` or `eval()`.
- Sanitize file paths: reject paths containing `..` before any file system operation.

## Cryptography
- Sensitive strings (API keys, Git tokens, credentials) encrypted with AES-256-GCM via the `CryptoService` before DB insert.
- Encryption key from `ENCRYPTION_KEY` env var (32 bytes hex). Never hardcoded.
- Use `crypto.randomBytes(16)` for IVs. Never reuse IVs.
- Passwords hashed with `bcrypt` (cost factor 12). Never SHA-1/MD5.

## Transport
- HTTPS enforced in production (behind reverse proxy). Backend sets `trust proxy`.
- `helmet` middleware applied globally (sets CSP, HSTS, X-Frame-Options, etc.).
- CORS: explicit whitelist of allowed origins from config. Never `origin: '*'` in production.

## Data Exposure (A02)
- API responses never include full DB row dumps — use DTO mappers.
- Error responses never leak stack traces or internal paths in production.
- `NODE_ENV=production` disables verbose error details.

## Rate Limiting & DoS (A05)
- `rate-limiter-flexible` applied to all unauthenticated endpoints (login, register): 10 req/min.
- AI execution endpoints: configurable workspace-level rate limits (story 10.4).

## File Uploads
- Validate MIME type server-side (not just by extension).
- Max upload size enforced via `multer` limits.
- Uploaded files stored outside the web root with random UUIDs as names.

## Dependency Security
- `pnpm audit` runs in CI. Build fails on high/critical vulnerabilities.
- Dependabot enabled on the repo.
- No packages with known CVEs merged.

## Secrets in Logs
- Logger redacts fields matching: `password`, `token`, `secret`, `key`, `authorization`.
- Never log request bodies on auth endpoints.
