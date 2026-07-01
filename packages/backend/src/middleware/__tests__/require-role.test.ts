import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../require-auth.middleware';
import { requireRole } from '../require-role.middleware';
import type { UserRole } from '../../modules/auth/auth.types';

const TEST_SECRET = 'test-secret-for-require-role';

function createTestApp() {
  const app = express();
  app.get('/admin', requireAuth, requireRole('SUPER_ADMIN'), (_req, res) => res.json({ ok: true }));
  app.get('/multi', requireAuth, requireRole('SUPER_ADMIN', 'WORKSPACE_OWNER'), (_req, res) =>
    res.json({ ok: true }),
  );
  return app;
}

function makeToken(role: UserRole) {
  return jwt.sign({ sub: 'user-1', email: 'test@example.com', role }, TEST_SECRET, {
    expiresIn: '1h',
  });
}

describe('requireRole middleware', () => {
  let savedSecret: string | undefined;

  beforeEach(() => {
    savedSecret = process.env['JWT_SECRET'];
    process.env['JWT_SECRET'] = TEST_SECRET;
  });

  afterEach(() => {
    if (savedSecret === undefined) delete process.env['JWT_SECRET'];
    else process.env['JWT_SECRET'] = savedSecret;
  });

  it('returns 403 when the user role does not match', async () => {
    const token = makeToken('DEVELOPER');
    const res = await supertest(createTestApp())
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403, title: 'Forbidden' });
  });

  it('returns 401 when req.user is absent (no auth middleware upstream)', async () => {
    const app = express();
    app.get('/no-auth', requireRole('SUPER_ADMIN'), (_req, res) => res.json({ ok: true }));
    const res = await supertest(app).get('/no-auth');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' });
  });

  it('returns 403 when WORKSPACE_OWNER accesses SUPER_ADMIN-only route', async () => {
    const token = makeToken('WORKSPACE_OWNER');
    const res = await supertest(createTestApp())
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ status: 403, title: 'Forbidden' });
  });

  it('calls next() when the user has the required role', async () => {
    const token = makeToken('SUPER_ADMIN');
    const res = await supertest(createTestApp())
      .get('/admin')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('allows access when user role is one of multiple allowed roles', async () => {
    const token = makeToken('WORKSPACE_OWNER');
    const res = await supertest(createTestApp())
      .get('/multi')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('blocks access when user role is not in multiple allowed roles', async () => {
    const token = makeToken('VIEWER');
    const res = await supertest(createTestApp())
      .get('/multi')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
