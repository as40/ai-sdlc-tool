# General Engineering Rules

## Language & Runtime
- TypeScript strict mode is mandatory for all packages. `tsconfig.json` must include `"strict": true`.
- Target Node.js 20 LTS on the backend.
- No `any` types. Use `unknown` and narrow with type guards.
- Async/await everywhere. No raw `.then()/.catch()` chains unless wrapping a callback-based API.

## Code Quality
- No magic numbers or magic strings — use named constants in a `constants.ts` file.
- Max function length: 40 lines. Extract helper functions freely.
- Max file length: 300 lines. Split large files by responsibility.
- All exported functions and types must have JSDoc with at least a one-line description.
- All TODO comments must include a ticket reference: `// TODO(1.2): ...`

## Error Handling
- All errors bubble as typed error classes (extend `AppError` base class with `statusCode` and `code`).
- Express error handler (`errorHandler` middleware) is the single place that formats error responses.
- Never swallow errors with an empty `catch {}`.
- Log errors with structured JSON via the `logger` utility (not `console.log`).

## Imports & Dependencies
- Use absolute imports via `tsconfig` path aliases (`@backend/*`, `@frontend/*`).
- No circular dependencies. `madge` runs in CI to detect them.
- Prefer standard library or established packages over micro-libraries.
- All new dependencies must be reviewed for: bundle size, maintenance status, license.

## Environment Variables
- All env vars are defined in `.env.example` (checked into git).
- Actual `.env` files are in `.gitignore` and never committed.
- Access env vars only through the `config.ts` module, never `process.env` directly in business logic.
