import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AIConfigRecord } from '../ai-config.types';

const ROW_STUB = {
  id: 'cfg-001',
  workspaceId: 'ws-001',
  provider: 'Anthropic',
  modelName: 'claude-3-5-sonnet-20241022',
  apiKeyEncrypted: 'enc:secret',
  baseUrl: null,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const RECORD_STUB: AIConfigRecord = {
  id: ROW_STUB.id,
  workspaceId: ROW_STUB.workspaceId,
  provider: ROW_STUB.provider,
  modelName: ROW_STUB.modelName,
  baseUrl: null,
  isLocal: false,
  createdAt: ROW_STUB.createdAt,
  updatedAt: ROW_STUB.updatedAt,
};

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockInsert = vi.fn();
  const mockValues = vi.fn();
  const mockReturning = vi.fn();
  const mockUpdate = vi.fn();
  const mockSet = vi.fn();
  const mockDeleteFn = vi.fn();
  return {
    mockSelect,
    mockFrom,
    mockInsert,
    mockValues,
    mockReturning,
    mockUpdate,
    mockSet,
    mockDeleteFn,
  };
});

vi.mock('../../../db', () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    delete: mocks.mockDeleteFn,
  },
}));

vi.mock('../../../db/schema', () => ({ aiConfigurations: {} }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }));

function whereResult(data: unknown[] = []) {
  const limitFn = vi.fn().mockResolvedValue(data);
  return Object.assign(Promise.resolve(data), { limit: limitFn });
}

function resetChain(selectData: unknown[] = []) {
  mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  mocks.mockFrom.mockReturnValue({ where: () => whereResult(selectData) });

  mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
  mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
  mocks.mockReturning.mockResolvedValue([ROW_STUB]);

  const mockWhere = vi.fn().mockReturnValue({ returning: mocks.mockReturning });
  mocks.mockUpdate.mockReturnValue({ set: mocks.mockSet });
  mocks.mockSet.mockReturnValue({ where: mockWhere });

  const mockDeleteWhere = vi.fn().mockReturnValue({ returning: mocks.mockReturning });
  mocks.mockDeleteFn.mockReturnValue({ where: mockDeleteWhere });
}

describe('AIConfigRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  describe('create', () => {
    it('inserts a new config and returns record without apiKeyEncrypted', async () => {
      mocks.mockReturning.mockResolvedValue([ROW_STUB]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      const result = await repo.create({
        workspaceId: 'ws-001',
        provider: 'Anthropic',
        modelName: 'claude-3-5-sonnet-20241022',
        apiKeyEncrypted: 'enc:secret',
        isLocal: false,
      });

      expect(mocks.mockInsert).toHaveBeenCalledOnce();
      expect(result).not.toHaveProperty('apiKeyEncrypted');
      expect(result.provider).toBe('Anthropic');
    });
  });

  describe('findAllForWorkspace', () => {
    it('returns mapped records for the workspace', async () => {
      resetChain([ROW_STUB]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      const result = await repo.findAllForWorkspace('ws-001');

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(RECORD_STUB);
      expect(result[0]).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns empty array when no configs exist', async () => {
      resetChain([]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.findAllForWorkspace('ws-999')).toHaveLength(0);
    });
  });

  describe('findById', () => {
    it('returns the record when found', async () => {
      resetChain([ROW_STUB]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      const result = await repo.findById('cfg-001', 'ws-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('cfg-001');
      expect(result).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns null when not found', async () => {
      resetChain([]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.findById('nonexistent', 'ws-001')).toBeNull();
    });
  });

  describe('findByIdWithKey', () => {
    it('returns record and the encrypted key', async () => {
      resetChain([ROW_STUB]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      const found = await repo.findByIdWithKey('cfg-001', 'ws-001');

      expect(found).not.toBeNull();
      expect(found?.apiKeyEncrypted).toBe('enc:secret');
      expect(found?.record).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns null when not found', async () => {
      resetChain([]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.findByIdWithKey('nonexistent', 'ws-001')).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns the mapped record', async () => {
      const updated = { ...ROW_STUB, modelName: 'claude-opus-4-8' };
      mocks.mockReturning.mockResolvedValue([updated]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      const result = await repo.update('cfg-001', 'ws-001', { modelName: 'claude-opus-4-8' });

      expect(mocks.mockUpdate).toHaveBeenCalledOnce();
      expect(result?.modelName).toBe('claude-opus-4-8');
      expect(result).not.toHaveProperty('apiKeyEncrypted');
    });

    it('returns null when nothing matches', async () => {
      mocks.mockReturning.mockResolvedValue([]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.update('nonexistent', 'ws-001', {})).toBeNull();
    });
  });

  describe('delete', () => {
    it('returns true when a row was deleted', async () => {
      mocks.mockReturning.mockResolvedValue([{ id: 'cfg-001' }]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.delete('cfg-001', 'ws-001')).toBe(true);
    });

    it('returns false when nothing was deleted', async () => {
      mocks.mockReturning.mockResolvedValue([]);
      const { AIConfigRepository } = await import('../ai-config.repository');
      const repo = new AIConfigRepository();

      expect(await repo.delete('nonexistent', 'ws-001')).toBe(false);
    });
  });
});
