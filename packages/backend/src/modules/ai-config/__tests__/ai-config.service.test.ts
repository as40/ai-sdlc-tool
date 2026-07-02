import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceError } from '../ai-config.errors';
import type { AIConfigRecord } from '../ai-config.types';

const CONFIG_STUB: AIConfigRecord = {
  id: 'cfg-001',
  workspaceId: 'ws-001',
  provider: 'Anthropic',
  modelName: 'claude-3-5-sonnet-20241022',
  baseUrl: null,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRepo = vi.hoisted(() => ({
  create: vi.fn(),
  findAllForWorkspace: vi.fn(),
  findById: vi.fn(),
  findByIdWithKey: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../ai-config.repository', () => ({ aiConfigRepository: mockRepo }));

const mockCrypto = vi.hoisted(() => ({
  encrypt: vi.fn((s: string) => `enc:${s}`),
  decrypt: vi.fn((s: string) => s.replace('enc:', '')),
}));

vi.mock('../../../utils/crypto.service', () => ({ cryptoService: mockCrypto }));

const mockGateway = vi.hoisted(() => ({
  testConnection: vi.fn(),
}));

vi.mock('../../../services/llm-gateway.service', () => ({ llmGateway: mockGateway }));

describe('AIConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createConfig', () => {
    it('encrypts apiKey and stores config — never returns raw key', async () => {
      mockRepo.create.mockResolvedValue(CONFIG_STUB);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      const result = await svc.createConfig('ws-001', {
        provider: 'Anthropic',
        modelName: 'claude-3-5-sonnet-20241022',
        apiKey: 'sk-ant-secret',
        isLocal: false,
      });

      expect(mockCrypto.encrypt).toHaveBeenCalledWith('sk-ant-secret');
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ apiKeyEncrypted: 'enc:sk-ant-secret' }),
      );
      expect(result).not.toHaveProperty('apiKeyEncrypted');
      expect(result.provider).toBe('Anthropic');
    });

    it('creates local config without encrypting an apiKey', async () => {
      const localConfig: AIConfigRecord = {
        ...CONFIG_STUB,
        id: 'cfg-002',
        isLocal: true,
        baseUrl: 'http://localhost:11434',
      };
      mockRepo.create.mockResolvedValue(localConfig);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await svc.createConfig('ws-001', {
        provider: 'Custom/Local',
        modelName: 'llama3',
        baseUrl: 'http://localhost:11434',
        isLocal: true,
      });

      expect(mockCrypto.encrypt).not.toHaveBeenCalled();
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ apiKeyEncrypted: undefined }),
      );
    });
  });

  describe('listConfigs', () => {
    it('returns all configs for a workspace without raw keys', async () => {
      mockRepo.findAllForWorkspace.mockResolvedValue([CONFIG_STUB]);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      const result = await svc.listConfigs('ws-001');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('apiKeyEncrypted');
    });
  });

  describe('updateConfig', () => {
    it('re-encrypts apiKey when updated', async () => {
      mockRepo.findById.mockResolvedValue(CONFIG_STUB);
      mockRepo.update.mockResolvedValue({ ...CONFIG_STUB, modelName: 'claude-opus-4-8' });
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      const result = await svc.updateConfig('cfg-001', 'ws-001', {
        modelName: 'claude-opus-4-8',
        apiKey: 'sk-new-key',
      });

      expect(mockCrypto.encrypt).toHaveBeenCalledWith('sk-new-key');
      expect(mockRepo.update).toHaveBeenCalledWith(
        'cfg-001',
        'ws-001',
        expect.objectContaining({
          apiKeyEncrypted: 'enc:sk-new-key',
          modelName: 'claude-opus-4-8',
        }),
      );
      expect(result).not.toHaveProperty('apiKeyEncrypted');
    });

    it('throws 404 when config does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await expect(
        svc.updateConfig('nonexistent', 'ws-001', { modelName: 'gpt-4o' }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteConfig', () => {
    it('deletes the config when found', async () => {
      mockRepo.delete.mockResolvedValue(true);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await svc.deleteConfig('cfg-001', 'ws-001');

      expect(mockRepo.delete).toHaveBeenCalledWith('cfg-001', 'ws-001');
    });

    it('throws 404 when config does not exist', async () => {
      mockRepo.delete.mockResolvedValue(false);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await expect(svc.deleteConfig('nonexistent', 'ws-001')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('testConnection', () => {
    it('decrypts apiKey and passes it to gateway', async () => {
      mockRepo.findByIdWithKey.mockResolvedValue({
        record: CONFIG_STUB,
        apiKeyEncrypted: 'enc:sk-ant-secret',
      });
      mockGateway.testConnection.mockResolvedValue({ success: true, latencyMs: 42 });
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      const result = await svc.testConnection('cfg-001', 'ws-001');

      expect(mockCrypto.decrypt).toHaveBeenCalledWith('enc:sk-ant-secret');
      expect(mockGateway.testConnection).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'sk-ant-secret' }),
      );
      expect(result).toEqual({ success: true, latencyMs: 42 });
    });

    it('throws 404 when config does not exist', async () => {
      mockRepo.findByIdWithKey.mockResolvedValue(null);
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await expect(svc.testConnection('nonexistent', 'ws-001')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('passes undefined apiKey for local configs with no key stored', async () => {
      const localConfig: AIConfigRecord = {
        ...CONFIG_STUB,
        isLocal: true,
        baseUrl: 'http://localhost:11434',
      };
      mockRepo.findByIdWithKey.mockResolvedValue({ record: localConfig, apiKeyEncrypted: null });
      mockGateway.testConnection.mockResolvedValue({ success: true, latencyMs: 5 });
      const { AIConfigService } = await import('../ai-config.service');
      const svc = new AIConfigService(mockRepo);

      await svc.testConnection('cfg-001', 'ws-001');

      expect(mockCrypto.decrypt).not.toHaveBeenCalled();
      expect(mockGateway.testConnection).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: undefined }),
      );
    });
  });

  describe('ServiceError', () => {
    it('is an instance of Error with correct properties', () => {
      const err = new ServiceError(403, 'Forbidden', 'No access.');
      expect(err).toBeInstanceOf(Error);
      expect(err.statusCode).toBe(403);
      expect(err.title).toBe('Forbidden');
      expect(err.message).toBe('No access.');
    });
  });
});
