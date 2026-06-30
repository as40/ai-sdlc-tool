import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SsoProfile } from '../user.types';

const USER_STUB = {
  id: 'user-uuid-001',
  email: 'alice@example.com',
  displayName: 'Alice Example',
  accessLevel: 'DEVELOPER' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mocks = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn();
  const mockSelectFrom = vi.fn();
  const mockSelect = vi.fn();

  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn();
  const mockInsert = vi.fn();

  const mockUpdateReturning = vi.fn();
  const mockUpdateWhere = vi.fn();
  const mockUpdateSet = vi.fn();
  const mockUpdate = vi.fn();

  const mockTransaction = vi.fn();

  return {
    mockSelectLimit,
    mockSelectWhere,
    mockSelectFrom,
    mockSelect,
    mockInsertReturning,
    mockInsertValues,
    mockInsert,
    mockUpdateReturning,
    mockUpdateWhere,
    mockUpdateSet,
    mockUpdate,
    mockTransaction,
  };
});

vi.mock('../../../db', () => ({
  db: {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
    transaction: mocks.mockTransaction,
  },
}));

vi.mock('../../../db/schema', () => ({ users: {} }));
vi.mock('drizzle-orm', () => ({ eq: vi.fn() }));

function makeTx() {
  return {
    select: mocks.mockSelect,
    insert: mocks.mockInsert,
    update: mocks.mockUpdate,
  };
}

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.mockSelect.mockReturnValue({ from: mocks.mockSelectFrom });
    mocks.mockSelectFrom.mockReturnValue({ where: mocks.mockSelectWhere });
    mocks.mockSelectWhere.mockReturnValue({ limit: mocks.mockSelectLimit });
    mocks.mockSelectLimit.mockResolvedValue([]);

    mocks.mockInsert.mockReturnValue({ values: mocks.mockInsertValues });
    mocks.mockInsertValues.mockReturnValue({ returning: mocks.mockInsertReturning });
    mocks.mockInsertReturning.mockResolvedValue([USER_STUB]);

    mocks.mockUpdate.mockReturnValue({ set: mocks.mockUpdateSet });
    mocks.mockUpdateSet.mockReturnValue({ where: mocks.mockUpdateWhere });
    mocks.mockUpdateWhere.mockReturnValue({ returning: mocks.mockUpdateReturning });
    mocks.mockUpdateReturning.mockResolvedValue([{ ...USER_STUB, displayName: 'Alice Updated' }]);

    mocks.mockTransaction.mockImplementation(
      async (cb: (tx: ReturnType<typeof makeTx>) => unknown) => cb(makeTx()),
    );
  });

  describe('findByEmail', () => {
    it('returns null when no user matches the email', async () => {
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const result = await repo.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });

    it('returns the user record when one exists', async () => {
      mocks.mockSelectLimit.mockResolvedValue([USER_STUB]);
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const result = await repo.findByEmail(USER_STUB.email);
      expect(result).toMatchObject({ email: USER_STUB.email, id: USER_STUB.id });
    });
  });

  describe('upsert — new user', () => {
    const profile: SsoProfile = {
      email: 'new@example.com',
      displayName: 'New User',
      providerId: 'sso|new001',
    };

    it('creates a new user when email does not exist', async () => {
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const { user, isNew } = await repo.upsert(profile);
      expect(isNew).toBe(true);
      expect(mocks.mockInsert).toHaveBeenCalledOnce();
      expect(user.email).toBe(USER_STUB.email);
    });

    it('inserts with accessLevel DEVELOPER by default', async () => {
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      await repo.upsert(profile);
      const valuesArg = mocks.mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
      expect(valuesArg.accessLevel).toBe('DEVELOPER');
    });
  });

  describe('upsert — existing user', () => {
    it('does not create a duplicate when email already exists', async () => {
      mocks.mockSelectLimit.mockResolvedValue([USER_STUB]);
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const { isNew } = await repo.upsert({
        email: USER_STUB.email,
        displayName: USER_STUB.displayName,
        providerId: 'sso|001',
      });
      expect(isNew).toBe(false);
      expect(mocks.mockInsert).not.toHaveBeenCalled();
    });

    it('updates displayName when it differs from the stored value', async () => {
      mocks.mockSelectLimit.mockResolvedValue([USER_STUB]);
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const { user, isNew } = await repo.upsert({
        email: USER_STUB.email,
        displayName: 'Alice Updated',
        providerId: 'sso|001',
      });
      expect(isNew).toBe(false);
      expect(mocks.mockUpdate).toHaveBeenCalledOnce();
      expect(user.displayName).toBe('Alice Updated');
    });

    it('does not call update when displayName is unchanged', async () => {
      mocks.mockSelectLimit.mockResolvedValue([USER_STUB]);
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      await repo.upsert({
        email: USER_STUB.email,
        displayName: USER_STUB.displayName,
        providerId: 'sso|001',
      });
      expect(mocks.mockUpdate).not.toHaveBeenCalled();
    });
  });

  describe('upsert — soft-deleted user', () => {
    it('returns the soft-deleted record without updating', async () => {
      const deletedUser = { ...USER_STUB, deletedAt: new Date() };
      mocks.mockSelectLimit.mockResolvedValue([deletedUser]);
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      const { user, isNew } = await repo.upsert({
        email: USER_STUB.email,
        displayName: 'New Name',
        providerId: 'sso|001',
      });
      expect(isNew).toBe(false);
      expect(user.deletedAt).not.toBeNull();
      expect(mocks.mockUpdate).not.toHaveBeenCalled();
      expect(mocks.mockInsert).not.toHaveBeenCalled();
    });
  });

  describe('upsert — transaction failure', () => {
    it('propagates the error when the transaction throws', async () => {
      mocks.mockTransaction.mockRejectedValue(new Error('DB connection lost'));
      const { UserRepository } = await import('../user.repository');
      const repo = new UserRepository();
      await expect(
        repo.upsert({ email: 'fail@example.com', displayName: 'Fail', providerId: 'x' }),
      ).rejects.toThrow('DB connection lost');
    });
  });
});
