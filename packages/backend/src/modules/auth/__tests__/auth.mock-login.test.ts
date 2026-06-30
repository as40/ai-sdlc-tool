import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../auth.types';

const TEST_JWT_SECRET = 'test-secret-for-auth-tests';

const mocks = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn();
  const mockFrom = vi.fn();
  const mockSelect = vi.fn();
  const mockReturning = vi.fn();
  const mockValues = vi.fn();
  const mockInsert = vi.fn();
  return { mockLimit, mockWhere, mockFrom, mockSelect, mockReturning, mockValues, mockInsert };
});

vi.mock('../../../db', () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
  },
}));

const USER_STUB = {
  id: 'user-abc-123',
  email: 'dev-developer@localhost',
  displayName: 'Dev DEVELOPER',
  accessLevel: 'DEVELOPER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

async function buildApp() {
  const { createApp } = await import('../../../app');
  return createApp();
}

describe('POST /api/auth/mock-login', () => {
  let savedNodeEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    savedNodeEnv = process.env['NODE_ENV'];
    process.env['JWT_SECRET'] = TEST_JWT_SECRET;
    process.env['NODE_ENV'] = 'development';

    mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
    mocks.mockFrom.mockReturnValue({ where: mocks.mockWhere });
    mocks.mockWhere.mockReturnValue({ limit: mocks.mockLimit });
    mocks.mockLimit.mockResolvedValue([]);

    mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
    mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
    mocks.mockReturning.mockResolvedValue([USER_STUB]);
  });

  afterEach(() => {
    process.env['NODE_ENV'] = savedNodeEnv;
    delete process.env['JWT_SECRET'];
  });

  it('returns 404 when NODE_ENV is production', async () => {
    process.env['NODE_ENV'] = 'production';
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({ role: 'DEVELOPER' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid role', async () => {
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({ role: 'NOT_A_ROLE' });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ status: 400, title: 'Validation Error' });
  });

  it('returns 400 when role is missing', async () => {
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({});
    expect(res.status).toBe(400);
  });

  const roles = ['SUPER_ADMIN', 'WORKSPACE_OWNER', 'DEVELOPER', 'VIEWER'] as const;

  for (const role of roles) {
    it(`returns 200 with a valid JWT for role ${role}`, async () => {
      mocks.mockReturning.mockResolvedValue([{ ...USER_STUB, accessLevel: role }]);
      const app = await buildApp();
      const res = await supertest(app).post('/api/auth/mock-login').send({ role });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });
  }

  it('JWT payload contains the correct role', async () => {
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({ role: 'WORKSPACE_OWNER' });
    expect(res.status).toBe(200);
    const payload = jwt.decode(res.body.token as string) as JwtPayload & { role: string };
    expect(payload.role).toBe('WORKSPACE_OWNER');
    expect(payload.sub).toBeDefined();
    expect(payload.email).toBeDefined();
  });

  it('JWT is verifiable with JWT_SECRET', async () => {
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({ role: 'DEVELOPER' });
    expect(res.status).toBe(200);
    expect(() => jwt.verify(res.body.token as string, TEST_JWT_SECRET)).not.toThrow();
  });

  it('uses provided email in the JWT payload', async () => {
    mocks.mockReturning.mockResolvedValue([{ ...USER_STUB, email: 'custom@example.com' }]);
    const app = await buildApp();
    const res = await supertest(app)
      .post('/api/auth/mock-login')
      .send({ role: 'DEVELOPER', email: 'custom@example.com' });
    expect(res.status).toBe(200);
    const payload = jwt.decode(res.body.token as string) as JwtPayload;
    expect(payload.email).toBe('custom@example.com');
  });

  it('reuses an existing user if one exists for the email', async () => {
    const existingUser = { ...USER_STUB, id: 'existing-user-id' };
    mocks.mockLimit.mockResolvedValue([existingUser]);
    const app = await buildApp();
    const res = await supertest(app).post('/api/auth/mock-login').send({ role: 'DEVELOPER' });
    expect(res.status).toBe(200);
    expect(mocks.mockInsert).not.toHaveBeenCalled();
    const payload = jwt.decode(res.body.token as string) as JwtPayload;
    expect(payload.sub).toBe('existing-user-id');
  });
});
