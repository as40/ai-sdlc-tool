import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';

const TEST_SECRET = 'test-secret-for-sso-routes';
const TEST_ENC_KEY = 'b'.repeat(64);
const WORKSPACE_ID = 'ws-test-123';

type PassportCb = (err: unknown, profile: unknown) => void;
type ExpressMiddleware = (req: unknown, res: unknown, next: unknown) => void;

// ── DB mock ────────────────────────────────────────────────────────────────
const dbMocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockWhere = vi.fn();
  const mockLimit = vi.fn();
  const mockInsert = vi.fn();
  const mockValues = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteWhere = vi.fn();
  return {
    mockSelect,
    mockFrom,
    mockWhere,
    mockLimit,
    mockInsert,
    mockValues,
    mockDelete,
    mockDeleteWhere,
  };
});

vi.mock('../../../db', () => ({
  db: {
    select: dbMocks.mockSelect,
    insert: dbMocks.mockInsert,
    delete: dbMocks.mockDelete,
  },
}));

// ── passport mock ──────────────────────────────────────────────────────────
const passportMocks = vi.hoisted(() => ({
  authenticateFn: vi.fn(),
  useFn: vi.fn(),
}));

vi.mock('passport', () => ({
  default: {
    use: passportMocks.useFn,
    initialize: () => (_req: unknown, _res: unknown, next: () => void) => next(),
    authenticate: passportMocks.authenticateFn,
  },
}));

// ── strategy constructor mocks (prevents real OIDC/SAML constructors) ─────
vi.mock('passport-openidconnect', () => ({
  Strategy: vi.fn().mockImplementation(() => ({ name: 'openidconnect' })),
}));

vi.mock('@node-saml/passport-saml', () => ({
  Strategy: vi.fn().mockImplementation(() => ({ name: 'saml' })),
}));

// ── helpers ────────────────────────────────────────────────────────────────

function makeToken(role: string) {
  return jwt.sign({ sub: 'user-1', email: 'admin@example.com', role }, TEST_SECRET, {
    expiresIn: '1h',
  });
}

async function buildApp() {
  const { createApp } = await import('../../../app');
  return createApp();
}

/** Test-only app that pre-injects workspaceId into the session for callback tests. */
async function buildAppWithSession(workspaceId: string) {
  const { createAuthRouter } = await import('../auth.routes');
  const passport = (await import('passport')).default;
  const app = express();
  app.use(express.json());
  app.use(session({ secret: 'test-session-secret', resave: false, saveUninitialized: true }));
  app.use(passport.initialize());
  app.use((req, _res, next) => {
    (req.session as Record<string, unknown>)['ssoWorkspaceId'] = workspaceId;
    next();
  });
  app.use('/api/auth', createAuthRouter());
  return app;
}

function setupDbWithConfig(encryptedConfig: string) {
  dbMocks.mockSelect.mockReturnValue({ from: dbMocks.mockFrom });
  dbMocks.mockFrom.mockReturnValue({ where: dbMocks.mockWhere });
  dbMocks.mockWhere.mockReturnValue({ limit: dbMocks.mockLimit });
  dbMocks.mockLimit.mockResolvedValue([{ configEncrypted: encryptedConfig }]);
}

function setupDbEmpty() {
  dbMocks.mockSelect.mockReturnValue({ from: dbMocks.mockFrom });
  dbMocks.mockFrom.mockReturnValue({ where: dbMocks.mockWhere });
  dbMocks.mockWhere.mockReturnValue({ limit: dbMocks.mockLimit });
  dbMocks.mockLimit.mockResolvedValue([]);
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('SSO routes', () => {
  let savedSecret: string | undefined;
  let savedKey: string | undefined;
  let encryptedOidcConfig: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    savedSecret = process.env['JWT_SECRET'];
    savedKey = process.env['ENCRYPTION_KEY'];
    process.env['JWT_SECRET'] = TEST_SECRET;
    process.env['ENCRYPTION_KEY'] = TEST_ENC_KEY;

    const { cryptoService } = await import('../../../utils/crypto.service');
    encryptedOidcConfig = cryptoService.encrypt(
      JSON.stringify({
        clientId: 'cid',
        clientSecret: 'cs',
        issuer: 'https://idp.example.com',
        authorizationUrl: 'https://idp.example.com/auth',
        tokenUrl: 'https://idp.example.com/token',
        userInfoUrl: 'https://idp.example.com/userinfo',
        redirectUri: 'https://app.example.com/callback',
      }),
    );

    setupDbEmpty();
    dbMocks.mockDelete.mockReturnValue({ where: dbMocks.mockDeleteWhere });
    dbMocks.mockDeleteWhere.mockResolvedValue(undefined);
    dbMocks.mockInsert.mockReturnValue({ values: dbMocks.mockValues });
    dbMocks.mockValues.mockResolvedValue(undefined);

    // Default: with-callback → call immediately; without-callback → redirect
    passportMocks.authenticateFn.mockImplementation(
      (_name: string, _opts: unknown, callback?: PassportCb): ExpressMiddleware => {
        if (callback) {
          return (_req, _res, _next) => {
            callback(null, { emails: [{ value: 'sso-user@example.com' }] });
          };
        }
        return (_req, res, _next) =>
          (res as { redirect: (url: string) => void }).redirect('https://idp.example.com/auth');
      },
    );
  });

  afterEach(() => {
    if (savedSecret === undefined) delete process.env['JWT_SECRET'];
    else process.env['JWT_SECRET'] = savedSecret;
    if (savedKey === undefined) delete process.env['ENCRYPTION_KEY'];
    else process.env['ENCRYPTION_KEY'] = savedKey;
  });

  // ── OIDC initiate ────────────────────────────────────────────────────────
  describe('GET /api/auth/oidc', () => {
    it('returns 400 when workspaceId is missing', async () => {
      const app = await buildApp();
      const res = await supertest(app).get('/api/auth/oidc');
      expect(res.status).toBe(400);
    });

    it('returns 404 when no OIDC config exists for the workspace', async () => {
      setupDbEmpty();
      const app = await buildApp();
      const res = await supertest(app).get(`/api/auth/oidc?workspaceId=${WORKSPACE_ID}`);
      expect(res.status).toBe(404);
    });

    it('calls passport.authenticate and initiates redirect when config exists', async () => {
      setupDbWithConfig(encryptedOidcConfig);
      const app = await buildApp();
      const res = await supertest(app).get(`/api/auth/oidc?workspaceId=${WORKSPACE_ID}`);
      expect(passportMocks.useFn).toHaveBeenCalled();
      expect(passportMocks.authenticateFn).toHaveBeenCalled();
      expect(res.status).toBe(302);
    });
  });

  // ── OIDC callback ────────────────────────────────────────────────────────
  describe('GET /api/auth/oidc/callback', () => {
    it('redirects with missing_workspace when session has no workspaceId', async () => {
      const app = await buildApp();
      const res = await supertest(app).get('/api/auth/oidc/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('missing_workspace');
    });

    it('redirects with no_oidc_config when config is not found', async () => {
      setupDbEmpty();
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).get('/api/auth/oidc/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('no_oidc_config');
    });

    it('issues a JWT and redirects to frontend when passport succeeds', async () => {
      setupDbWithConfig(encryptedOidcConfig);
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).get('/api/auth/oidc/callback');
      expect(res.status).toBe(302);
      const location = res.headers['location'] as string;
      expect(location).toContain('token=');
      const token = new URLSearchParams(location.split('?')[1]).get('token') ?? '';
      expect(() => jwt.verify(token, TEST_SECRET)).not.toThrow();
    });

    it('redirects with sso_failed when passport returns no profile', async () => {
      setupDbWithConfig(encryptedOidcConfig);
      passportMocks.authenticateFn.mockImplementation(
        (_name: string, _opts: unknown, callback: PassportCb): ExpressMiddleware =>
          (_req, _res, _next) =>
            callback(null, null),
      );
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).get('/api/auth/oidc/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('sso_failed');
    });

    it('redirects with no_email when profile has no email', async () => {
      setupDbWithConfig(encryptedOidcConfig);
      passportMocks.authenticateFn.mockImplementation(
        (_name: string, _opts: unknown, callback: PassportCb): ExpressMiddleware =>
          (_req, _res, _next) =>
            callback(null, { emails: [], _json: {} }),
      );
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).get('/api/auth/oidc/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('no_email');
    });
  });

  // ── SAML initiate ────────────────────────────────────────────────────────
  describe('POST /api/auth/saml', () => {
    it('returns 400 when workspaceId is missing', async () => {
      const app = await buildApp();
      const res = await supertest(app).post('/api/auth/saml');
      expect(res.status).toBe(400);
    });

    it('returns 404 when no SAML config exists for the workspace', async () => {
      setupDbEmpty();
      const app = await buildApp();
      const res = await supertest(app).post(`/api/auth/saml?workspaceId=${WORKSPACE_ID}`);
      expect(res.status).toBe(404);
    });

    it('calls passport.authenticate when SAML config exists', async () => {
      const { cryptoService } = await import('../../../utils/crypto.service');
      const samlConfig = cryptoService.encrypt(
        JSON.stringify({
          entryPoint: 'https://idp.example.com/saml',
          certificate: 'CERT',
          issuer: 'app',
        }),
      );
      setupDbWithConfig(samlConfig);
      const app = await buildApp();
      const res = await supertest(app).post(`/api/auth/saml?workspaceId=${WORKSPACE_ID}`);
      expect(passportMocks.authenticateFn).toHaveBeenCalled();
      expect(res.status).toBe(302);
    });
  });

  // ── SAML callback ────────────────────────────────────────────────────────
  describe('POST /api/auth/saml/callback', () => {
    it('redirects with missing_workspace when session has no workspaceId', async () => {
      const app = await buildApp();
      const res = await supertest(app).post('/api/auth/saml/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('missing_workspace');
    });

    it('redirects with no_saml_config when config is not found', async () => {
      setupDbEmpty();
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).post('/api/auth/saml/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('no_saml_config');
    });

    it('issues a JWT and redirects when SAML passport succeeds', async () => {
      const { cryptoService } = await import('../../../utils/crypto.service');
      const samlConfig = cryptoService.encrypt(
        JSON.stringify({
          entryPoint: 'https://idp.example.com/saml',
          certificate: 'CERT',
          issuer: 'app',
        }),
      );
      setupDbWithConfig(samlConfig);
      passportMocks.authenticateFn.mockImplementation(
        (_name: string, _opts: unknown, callback: PassportCb): ExpressMiddleware =>
          (_req, _res, _next) =>
            callback(null, { email: 'saml-user@example.com' }),
      );
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).post('/api/auth/saml/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('token=');
    });

    it('redirects with sso_failed when SAML passport returns no profile', async () => {
      const { cryptoService } = await import('../../../utils/crypto.service');
      const samlConfig = cryptoService.encrypt(
        JSON.stringify({
          entryPoint: 'https://idp.example.com/saml',
          certificate: 'CERT',
          issuer: 'app',
        }),
      );
      setupDbWithConfig(samlConfig);
      passportMocks.authenticateFn.mockImplementation(
        (_name: string, _opts: unknown, callback: PassportCb): ExpressMiddleware =>
          (_req, _res, _next) =>
            callback(null, null),
      );
      const app = await buildAppWithSession(WORKSPACE_ID);
      const res = await supertest(app).post('/api/auth/saml/callback');
      expect(res.status).toBe(302);
      expect(res.headers['location']).toContain('sso_failed');
    });
  });

  // ── Admin config GET ─────────────────────────────────────────────────────
  describe('GET /api/auth/sso/config', () => {
    it('returns 401 with no auth token', async () => {
      const app = await buildApp();
      const res = await supertest(app).get(
        `/api/auth/sso/config?workspaceId=${WORKSPACE_ID}&provider=oidc`,
      );
      expect(res.status).toBe(401);
    });

    it('returns 403 for DEVELOPER role', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .get(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}&provider=oidc`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`);
      expect(res.status).toBe(403);
    });

    it('returns 400 when workspaceId or provider is missing', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .get('/api/auth/sso/config')
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`);
      expect(res.status).toBe(400);
    });

    it('returns 404 when no config exists (SUPER_ADMIN)', async () => {
      setupDbEmpty();
      const app = await buildApp();
      const res = await supertest(app)
        .get(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}&provider=oidc`)
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`);
      expect(res.status).toBe(404);
    });

    it('returns 200 with config for SUPER_ADMIN when config exists', async () => {
      setupDbWithConfig(encryptedOidcConfig);
      const app = await buildApp();
      const res = await supertest(app)
        .get(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}&provider=oidc`)
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('config');
    });
  });

  // ── Admin config POST ────────────────────────────────────────────────────
  describe('POST /api/auth/sso/config', () => {
    const validOidcBody = {
      provider: 'oidc',
      config: {
        clientId: 'cid',
        clientSecret: 'cs',
        issuer: 'https://idp.example.com',
        authorizationUrl: 'https://idp.example.com/auth',
        tokenUrl: 'https://idp.example.com/token',
        userInfoUrl: 'https://idp.example.com/userinfo',
        redirectUri: 'https://app.example.com/callback',
      },
    };

    it('returns 403 for non-SUPER_ADMIN', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .post(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`)
        .send(validOidcBody);
      expect(res.status).toBe(403);
    });

    it('returns 400 when workspaceId or provider is missing', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .post('/api/auth/sso/config')
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`)
        .send({ config: {} });
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid OIDC config schema', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .post(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}`)
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`)
        .send({ provider: 'oidc', config: { clientId: 'only-one' } });
      expect(res.status).toBe(400);
    });

    it('saves and returns 200 for valid OIDC config (SUPER_ADMIN)', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .post(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}`)
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`)
        .send(validOidcBody);
      expect(res.status).toBe(200);
      expect(dbMocks.mockInsert).toHaveBeenCalled();
    });

    it('saves valid SAML config and returns 200', async () => {
      const app = await buildApp();
      const res = await supertest(app)
        .post(`/api/auth/sso/config?workspaceId=${WORKSPACE_ID}`)
        .set('Authorization', `Bearer ${makeToken('SUPER_ADMIN')}`)
        .send({
          provider: 'saml',
          config: {
            entryPoint: 'https://idp.example.com/saml',
            certificate: 'CERT',
            issuer: 'app',
          },
        });
      expect(res.status).toBe(200);
    });
  });
});
