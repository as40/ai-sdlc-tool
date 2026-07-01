import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import supertest from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ServiceError } from '../ai-config.errors';
import type { UserRole } from '../../auth/auth.types';
import type { AIConfigRecord } from '../ai-config.types';
import type { WorkspaceMemberRecord } from '../../workspaces/workspace.types';

const TEST_SECRET = 'test-secret-ai-config-routes';
const WS_ID = 'ws-test-001';
const CFG_ID = 'cfg-test-001';

const CONFIG_STUB: AIConfigRecord = {
  id: CFG_ID,
  workspaceId: WS_ID,
  provider: 'Anthropic',
  modelName: 'claude-3-5-sonnet-20241022',
  baseUrl: null,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const MEMBER_STUB: WorkspaceMemberRecord = {
  id: 'mem-001',
  workspaceId: WS_ID,
  userId: 'user-owner',
  accessLevel: 'WORKSPACE_OWNER',
  createdAt: new Date(),
};

const mockService = vi.hoisted(() => ({
  createConfig: vi.fn(),
  listConfigs: vi.fn(),
  updateConfig: vi.fn(),
  deleteConfig: vi.fn(),
  testConnection: vi.fn(),
}));

vi.mock('../ai-config.service', () => ({
  aiConfigService: mockService,
}));

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
  const { createWorkspaceRouter } = await import('../../workspaces/workspace.routes');
  const app = express();
  app.use(express.json());
  app.use('/api/workspaces', createWorkspaceRouter());
  return app;
}

describe('AI Config routes', () => {
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

  describe('POST /api/workspaces/:id/ai-config', () => {
    it('creates a config and returns 201 for WORKSPACE_OWNER', async () => {
      mockService.createConfig.mockResolvedValue(CONFIG_STUB);
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({
          provider: 'Anthropic',
          modelName: 'claude-3-5-sonnet-20241022',
          apiKey: 'sk-ant-secret',
          isLocal: false,
        });

      expect(res.status).toBe(201);
      expect(res.body.id).toBe(CFG_ID);
      expect(res.body).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns 400 when apiKey is missing for cloud provider', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ provider: 'OpenAI', modelName: 'gpt-4o', isLocal: false });

      expect(res.status).toBe(400);
    });

    it('returns 400 when provider is invalid', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ provider: 'UnknownProvider', modelName: 'model', isLocal: false, apiKey: 'key' });

      expect(res.status).toBe(400);
    });

    it('returns 403 when DEVELOPER tries to create config', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`)
        .send({
          provider: 'Anthropic',
          modelName: 'claude-3-5-sonnet-20241022',
          apiKey: 'sk-ant-secret',
          isLocal: false,
        });

      expect(res.status).toBe(403);
    });

    it('returns 401 without a token', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config`)
        .send({ provider: 'Anthropic', modelName: 'claude-3-5-sonnet-20241022', isLocal: false });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workspaces/:id/ai-config', () => {
    it('lists all configs and never returns raw apiKey', async () => {
      mockService.listConfigs.mockResolvedValue([CONFIG_STUB]);
      const app = await createTestApp();

      const res = await supertest(app)
        .get(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns 403 when DEVELOPER tries to list configs', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .get(`/api/workspaces/${WS_ID}/ai-config`)
        .set('Authorization', `Bearer ${makeToken('DEVELOPER')}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/workspaces/:id/ai-config/:configId', () => {
    it('updates the config and returns 200', async () => {
      mockService.updateConfig.mockResolvedValue({ ...CONFIG_STUB, modelName: 'claude-opus-4-8' });
      const app = await createTestApp();

      const res = await supertest(app)
        .put(`/api/workspaces/${WS_ID}/ai-config/${CFG_ID}`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ modelName: 'claude-opus-4-8' });

      expect(res.status).toBe(200);
      expect(res.body.modelName).toBe('claude-opus-4-8');
    });

    it('returns 404 when config does not exist', async () => {
      mockService.updateConfig.mockRejectedValue(
        new ServiceError(404, 'Not Found', 'AI configuration not found.'),
      );
      const app = await createTestApp();

      const res = await supertest(app)
        .put(`/api/workspaces/${WS_ID}/ai-config/nonexistent`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ modelName: 'gpt-4o' });

      expect(res.status).toBe(404);
    });

    it('returns 400 when setting isLocal=false without apiKey', async () => {
      const app = await createTestApp();

      const res = await supertest(app)
        .put(`/api/workspaces/${WS_ID}/ai-config/${CFG_ID}`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`)
        .send({ isLocal: false });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/workspaces/:id/ai-config/:configId', () => {
    it('deletes a config and returns 204', async () => {
      mockService.deleteConfig.mockResolvedValue(undefined);
      const app = await createTestApp();

      const res = await supertest(app)
        .delete(`/api/workspaces/${WS_ID}/ai-config/${CFG_ID}`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`);

      expect(res.status).toBe(204);
      expect(mockService.deleteConfig).toHaveBeenCalledWith(CFG_ID, WS_ID);
    });

    it('returns 404 when config does not exist', async () => {
      mockService.deleteConfig.mockRejectedValue(
        new ServiceError(404, 'Not Found', 'AI configuration not found.'),
      );
      const app = await createTestApp();

      const res = await supertest(app)
        .delete(`/api/workspaces/${WS_ID}/ai-config/nonexistent`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/workspaces/:id/ai-config/:configId/test', () => {
    it('returns { success: true, latencyMs } from gateway', async () => {
      mockService.testConnection.mockResolvedValue({ success: true, latencyMs: 42 });
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config/${CFG_ID}/test`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.latencyMs).toBe('number');
    });

    it('returns 404 when config does not exist', async () => {
      mockService.testConnection.mockRejectedValue(
        new ServiceError(404, 'Not Found', 'AI configuration not found.'),
      );
      const app = await createTestApp();

      const res = await supertest(app)
        .post(`/api/workspaces/${WS_ID}/ai-config/nonexistent/test`)
        .set('Authorization', `Bearer ${makeToken('WORKSPACE_OWNER')}`);

      expect(res.status).toBe(404);
    });
  });
});
