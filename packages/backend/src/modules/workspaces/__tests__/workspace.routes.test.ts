import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ServiceError } from '../workspace.errors';
import type { UserRole } from '../../auth/auth.types';
import type { WorkspaceMemberRecord, WorkspaceRecord } from '../workspace.types';

const TEST_SECRET = 'test-secret-workspace-routes';
const WS_ID = 'ws-test-001';

const WORKSPACE_STUB: WorkspaceRecord = {
  id: WS_ID,
  name: 'Test Workspace',
  ownerId: 'user-owner',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MEMBER_STUB: WorkspaceMemberRecord = {
  id: 'mem-001',
  workspaceId: WS_ID,
  userId: 'user-owner',
  accessLevel: 'WORKSPACE_OWNER',
  createdAt: new Date(),
};

// ── service mock ──────────────────────────────────────────────────────────────
const mockService = vi.hoisted(() => ({
  createWorkspace: vi.fn(),
  listWorkspaces: vi.fn(),
  getWorkspace: vi.fn(),
  inviteUser: vi.fn(),
  removeMember: vi.fn(),
}));

vi.mock('../workspace.service', () => ({ workspaceService: mockService }));

// ── workspace-guard mock — attaches workspaceId and member from user context ──
vi.mock('../../../middleware/workspace-guard.middleware', () => ({
  workspaceGuard: vi.fn(
    (req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.workspaceId = WS_ID;
      req.workspaceMember = {
        ...MEMBER_STUB,
        userId: req.user?.sub ?? 'user-owner',
        accessLevel: req.user?.role ?? 'DEVELOPER',
      } as WorkspaceMemberRecord;
      next();
    },
  ),
}));

function makeToken(role: UserRole, sub = 'user-owner') {
  return jwt.sign({ sub, email: `${sub}@test.com`, role }, TEST_SECRET, { expiresIn: '1h' });
}

async function createTestApp() {
  const { createWorkspaceRouter } = await import('../workspace.routes');
  const app = express();
  app.use(express.json());
  app.use('/api/workspaces', createWorkspaceRouter());
  return app;
}

describe('Workspace routes', () => {
  let savedSecret: string | undefined;

  beforeEach(() => {
    savedSecret = process.env['JWT_SECRET'];
    process.env['JWT_SECRET'] = TEST_SECRET;
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (savedSecret === undefined) delete process.env['JWT_SECRET'];
    else process.env['JWT_SECRET'] = savedSecret;
  });

  describe('POST /api/workspaces', () => {
    it('creates a workspace and returns 201', async () => {
      mockService.createWorkspace.mockResolvedValue({
        workspace: WORKSPACE_STUB,
        member: MEMBER_STUB,
      });
      const app = await createTestApp();
      const res = await supertest(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`)
        .send({ name: 'Test Workspace' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(WS_ID);
    });

    it('returns 400 when name is missing', async () => {
      const app = await createTestApp();
      const res = await supertest(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('returns 401 without a token', async () => {
      const app = await createTestApp();
      const res = await supertest(app).post('/api/workspaces').send({ name: 'X' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workspaces', () => {
    it('lists workspaces for the authenticated user', async () => {
      mockService.listWorkspaces.mockResolvedValue([WORKSPACE_STUB]);
      const app = await createTestApp();
      const res = await supertest(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    it('returns the workspace for a member', async () => {
      mockService.getWorkspace.mockResolvedValue(WORKSPACE_STUB);
      const app = await createTestApp();
      const res = await supertest(app)
        .get(`/api/workspaces/${WS_ID}`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Workspace');
    });
  });

  describe('POST /api/workspaces/:id/invites', () => {
    it('allows WORKSPACE_OWNER to invite a user', async () => {
      mockService.inviteUser.mockResolvedValue({
        ...MEMBER_STUB,
        id: 'mem-002',
        userId: 'user-002',
        accessLevel: 'DEVELOPER',
      });
      const app = await createTestApp();
      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/invites`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ email: 'dev@example.com', role: 'DEVELOPER' });
      expect(res.status).toBe(201);
      expect(mockService.inviteUser).toHaveBeenCalledWith(WS_ID, 'dev@example.com', 'DEVELOPER');
    });

    it('returns 403 when a DEVELOPER tries to invite', async () => {
      const app = await createTestApp();
      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/invites`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`)
        .send({ email: 'other@example.com', role: 'VIEWER' });
      expect(res.status).toBe(403);
    });

    it('returns 404 when invited user does not exist', async () => {
      mockService.inviteUser.mockRejectedValue(
        new ServiceError(404, 'Not Found', 'User not found.'),
      );
      const app = await createTestApp();
      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/invites`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ email: 'ghost@example.com', role: 'VIEWER' });
      expect(res.status).toBe(404);
    });

    it('returns 409 when user is already a member', async () => {
      mockService.inviteUser.mockRejectedValue(
        new ServiceError(409, 'Conflict', 'Already a member.'),
      );
      const app = await createTestApp();
      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/invites`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ email: 'existing@example.com', role: 'DEVELOPER' });
      expect(res.status).toBe(409);
    });

    it('returns 400 when invite body is invalid', async () => {
      const app = await createTestApp();
      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/invites`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ email: 'not-an-email', role: 'SUPER_ADMIN' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/workspaces/:id/members/:userId', () => {
    it('removes a member and returns 204', async () => {
      mockService.removeMember.mockResolvedValue(undefined);
      const app = await createTestApp();
      const res = await supertest(app)
        .delete(`/api/workspaces/${WS_ID}/members/user-002`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER', 'user-owner')}`);
      expect(res.status).toBe(204);
      expect(mockService.removeMember).toHaveBeenCalledWith(WS_ID, 'user-002', 'user-owner');
    });

    it('returns 400 when owner tries to remove themselves', async () => {
      mockService.removeMember.mockRejectedValue(
        new ServiceError(400, 'Bad Request', 'Cannot remove yourself.'),
      );
      const app = await createTestApp();
      const res = await supertest(app)
        .delete(`/api/workspaces/${WS_ID}/members/user-owner`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER', 'user-owner')}`);
      expect(res.status).toBe(400);
    });

    it('returns 403 when a DEVELOPER tries to remove a member', async () => {
      const app = await createTestApp();
      const res = await supertest(app)
        .delete(`/api/workspaces/${WS_ID}/members/user-002`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`);
      expect(res.status).toBe(403);
    });
  });
});
