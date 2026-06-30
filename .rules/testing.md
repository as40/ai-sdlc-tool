# Testing Rules

## Coverage Requirements
- Minimum 90% coverage on all new code in a story (line, branch, function).
- CI gate: build fails if overall coverage drops below 80%.
- Coverage report generated with `vitest --coverage` (c8 provider).

## Test Structure
```
packages/backend/
  src/services/crypto.service.ts
  src/services/__tests__/crypto.service.test.ts   ← unit tests

packages/backend/
  tests/integration/auth.routes.test.ts           ← integration/e2e tests
```

## Unit Tests
- Test every exported function in isolation.
- Mock all external dependencies (DB, HTTP calls, file system) using `vi.mock()`.
- Use Arrange / Act / Assert structure with clear comments.
- One assertion per test where possible.
- Test error paths and edge cases — not just the happy path.

## Integration Tests (Backend)
- Use `supertest` to call Express routes end-to-end.
- Use an in-memory or test PostgreSQL database (isolated schema per test run).
- Reset DB state between tests with `beforeEach` truncation.
- Test auth middleware: verify 401 without token, 403 with wrong role.

## Frontend Tests
- Component tests with React Testing Library + Vitest.
- Test user interactions (click, type, submit), not internal implementation details.
- Mock API calls with `msw` (Mock Service Worker).
- Snapshot tests ONLY for purely static UI; never for complex interactive components.

## Test Naming
```typescript
describe('CryptoService', () => {
  describe('encrypt', () => {
    it('should return a base64 string with IV prepended', () => { ... });
    it('should throw if plaintext is empty', () => { ... });
  });
});
```

## What NOT to Test
- Third-party library internals.
- Database migration files (test the queries they produce, not the migration runner).
- `console.log` calls.
