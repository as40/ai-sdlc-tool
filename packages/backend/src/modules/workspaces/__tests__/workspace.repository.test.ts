import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WorkspaceMemberRecord, WorkspaceRecord } from '../workspace.types';

const WORKSPACE_STUB: WorkspaceRecord = {
  id: 'ws-001',
  name: 'Acme',
  ownerId: 'user-001',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const MEMBER_STUB: WorkspaceMemberRecord = {
  id: 'mem-001',
  workspaceId: 'ws-001',
  userId: 'user-001',
  accessLevel: 'WORKSPACE_OWNER',
  createdAt: new Date(),
};

const mocks = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockFrom = vi.fn();
  const mockInnerJoin = vi.fn();
  const mockInsert = vi.fn();
  const mockValues = vi.fn();
  const mockReturning = vi.fn();
  const mockDelete = vi.fn();
  const mockDeleteWhere = vi.fn();
  const mockTransaction = vi.fn();
  return {
    mockSelect,
    mockFrom,
    mockInnerJoin,
    mockInsert,
    mockValues,
    mockReturning,
    mockDelete,
    mockDeleteWhere,
    mockTransaction,
  };
});

vi.mock('../../../db', () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    delete: mocks.mockDelete,
    transaction: mocks.mockTransaction,
  },
}));

vi.mock('../../../db/schema', () => ({ workspaces: {}, workspaceMembers: {}, users: {} }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), and: vi.fn() }));

// Creates a thenable that also has a .limit() method — handles both
//   await db.select().from().where()  and
//   await db.select().from().where().limit(n)
function whereResult(data: unknown[] = []) {
  const limitFn = vi.fn().mockResolvedValue(data);
  return Object.assign(Promise.resolve(data), { limit: limitFn });
}

function resetChain(defaultData: unknown[] = []) {
  mocks.mockSelect.mockReturnValue({ from: mocks.mockFrom });
  mocks.mockFrom.mockReturnValue({
    where: () => whereResult(defaultData),
    innerJoin: mocks.mockInnerJoin,
  });
  mocks.mockInnerJoin.mockReturnValue({ where: () => whereResult(defaultData) });

  mocks.mockInsert.mockReturnValue({ values: mocks.mockValues });
  mocks.mockValues.mockReturnValue({ returning: mocks.mockReturning });
  mocks.mockReturning.mockResolvedValue([WORKSPACE_STUB]);

  mocks.mockDelete.mockReturnValue({ where: mocks.mockDeleteWhere });
  mocks.mockDeleteWhere.mockResolvedValue([]);

  mocks.mockTransaction.mockImplementation(
    async (cb: (tx: { insert: typeof mocks.mockInsert }) => unknown) =>
      cb({ insert: mocks.mockInsert }),
  );
}

describe('WorkspaceRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetChain();
  });

  describe('createWithOwner', () => {
    it('inserts workspace and member in a transaction', async () => {
      mocks.mockReturning
        .mockResolvedValueOnce([WORKSPACE_STUB])
        .mockResolvedValueOnce([MEMBER_STUB]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      const result = await repo.createWithOwner('Acme', 'user-001');
      expect(result.workspace.id).toBe('ws-001');
      expect(result.member.accessLevel).toBe('WORKSPACE_OWNER');
      expect(mocks.mockTransaction).toHaveBeenCalledOnce();
    });
  });

  describe('findById', () => {
    it('returns null when workspace is not found', async () => {
      resetChain([]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect(await repo.findById('nonexistent')).toBeNull();
    });

    it('returns workspace when found', async () => {
      resetChain([WORKSPACE_STUB]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect((await repo.findById('ws-001'))?.id).toBe('ws-001');
    });
  });

  describe('findAllForUser', () => {
    it('returns workspaces the user belongs to', async () => {
      resetChain([{ workspace: WORKSPACE_STUB }]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      const result = await repo.findAllForUser('user-001');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ws-001');
    });

    it('returns empty array when user has no workspaces', async () => {
      resetChain([]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect(await repo.findAllForUser('user-999')).toHaveLength(0);
    });
  });

  describe('findMember', () => {
    it('returns null when member is not found', async () => {
      resetChain([]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect(await repo.findMember('ws-001', 'user-999')).toBeNull();
    });

    it('returns member record when found', async () => {
      resetChain([MEMBER_STUB]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect((await repo.findMember('ws-001', 'user-001'))?.userId).toBe('user-001');
    });
  });

  describe('findAllMembers', () => {
    it('returns all members of a workspace', async () => {
      resetChain([MEMBER_STUB]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect(await repo.findAllMembers('ws-001')).toHaveLength(1);
    });
  });

  describe('addMember', () => {
    it('inserts and returns the new member', async () => {
      mocks.mockReturning.mockResolvedValue([MEMBER_STUB]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      const result = await repo.addMember('ws-001', 'user-001', 'DEVELOPER');
      expect(result.workspaceId).toBe('ws-001');
      expect(mocks.mockInsert).toHaveBeenCalledOnce();
    });
  });

  describe('removeMember', () => {
    it('deletes the member row', async () => {
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      await repo.removeMember('ws-001', 'user-002');
      expect(mocks.mockDelete).toHaveBeenCalledOnce();
    });
  });

  describe('findUserByEmail', () => {
    it('returns null when no user matches', async () => {
      resetChain([]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect(await repo.findUserByEmail('ghost@example.com')).toBeNull();
    });

    it('returns user id when found', async () => {
      resetChain([{ id: 'user-001' }]);
      const { WorkspaceRepository } = await import('../workspace.repository');
      const repo = new WorkspaceRepository();
      expect((await repo.findUserByEmail('alice@example.com'))?.id).toBe('user-001');
    });
  });
});
