import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../require-auth.middleware';
import type { JwtPayload } from '../../modules/auth/auth.types';

const TEST_SECRET = 'test-secret-for-require-auth';

function createTestApp() {
  const app = express();
  app.get('/protected', requireAuth, (req, res) => {
    res.json({ user: req.user });
  });
  return app;
}

function makeToken(payload: Partial<JwtPayload>, secret = TEST_SECRET, options?: jwt.SignOptions) {
  return jwt.sign(
    { sub: 'user-1', email: 'test@example.com', role: 'DEVELOPER', ...payload },
    secret,
    { expiresIn: '1h', ...options },
  );
}

describe('requireAuth middleware', () => {
  let savedSecret: string | undefined;

  beforeEach(() => {
    savedSecret = process.env['JWT_SECRET'];
    process.env['JWT_SECRET'] = TEST_SECRET;
  });

  afterEach(() => {
    if (savedSecret === undefined) {
      delete process.env['JWT_SECRET'];
    } else {
      process.env['JWT_SECRET'] = savedSecret;
    }
  });

  it('returns 401 with no Authorization header', async () => {
    const res = await supertest(createTestApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' });
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', 'Basic abc123');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed token', async () => {
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-valid-jwt');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ status: 401, title: 'Unauthorized' });
  });

  it('returns 401 with an expired token', async () => {
    const token = makeToken({}, TEST_SECRET, { expiresIn: -1 });
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ detail: 'Invalid or expired token.' });
  });

  it('returns 401 when token is signed with the wrong secret', async () => {
    const token = makeToken({}, 'wrong-secret');
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('attaches req.user and calls next() for a valid token', async () => {
    const token = makeToken({ sub: 'user-42', email: 'alice@example.com', role: 'SUPER_ADMIN' });
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      sub: 'user-42',
      email: 'alice@example.com',
      role: 'SUPER_ADMIN',
    });
  });

  it('returns 500 when JWT_SECRET is not configured', async () => {
    delete process.env['JWT_SECRET'];
    const token = makeToken({});
    const res = await supertest(createTestApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(500);
  });
});
