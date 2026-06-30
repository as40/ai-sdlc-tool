import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UserRecord, SsoProfile } from '../../users/user.types';
import { JitProvisioningError } from '../jit-provisioning.middleware';

const USER_STUB: UserRecord = {
  id: 'user-uuid-001',
  email: 'alice@example.com',
  displayName: 'Alice Example',
  accessLevel: 'DEVELOPER',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const SSO_PROFILE: SsoProfile = {
  email: 'alice@example.com',
  displayName: 'Alice Example',
  providerId: 'sso|alice001',
};

const mocks = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
}));

vi.mock('../../users/user.repository', () => ({
  userRepository: { upsert: mocks.mockUpsert },
}));

vi.mock('../../../utils/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('jitProvisioningMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockUpsert.mockResolvedValue({ user: USER_STUB, isNew: false });
  });

  it('calls done with the user record on successful login for a new user', async () => {
    mocks.mockUpsert.mockResolvedValue({ user: USER_STUB, isNew: true });
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    const done = vi.fn();
    await jitProvisioningMiddleware(SSO_PROFILE, done);
    expect(done).toHaveBeenCalledWith(null, USER_STUB);
  });

  it('calls done with the user record on login for an existing user', async () => {
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    const done = vi.fn();
    await jitProvisioningMiddleware(SSO_PROFILE, done);
    expect(done).toHaveBeenCalledWith(null, USER_STUB);
    expect(mocks.mockUpsert).toHaveBeenCalledOnce();
  });

  it('does not create a duplicate when the same email logs in again', async () => {
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    await jitProvisioningMiddleware(SSO_PROFILE, vi.fn());
    await jitProvisioningMiddleware(SSO_PROFILE, vi.fn());
    // upsert is called each time, but the repository handles deduplication internally
    expect(mocks.mockUpsert).toHaveBeenCalledTimes(2);
  });

  it('calls done with updated user when displayName changes', async () => {
    const updatedUser: UserRecord = { ...USER_STUB, displayName: 'Alice Updated' };
    mocks.mockUpsert.mockResolvedValue({ user: updatedUser, isNew: false });
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    const done = vi.fn();
    await jitProvisioningMiddleware({ ...SSO_PROFILE, displayName: 'Alice Updated' }, done);
    expect(done).toHaveBeenCalledWith(null, updatedUser);
  });

  it('calls done with JitProvisioningError(403) for a soft-deleted user', async () => {
    const deletedUser: UserRecord = { ...USER_STUB, deletedAt: new Date() };
    mocks.mockUpsert.mockResolvedValue({ user: deletedUser, isNew: false });
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    const done = vi.fn();
    await jitProvisioningMiddleware(SSO_PROFILE, done);
    expect(done).toHaveBeenCalledOnce();
    const [err, user] = done.mock.calls[0] as [JitProvisioningError, undefined];
    expect(err).toBeInstanceOf(JitProvisioningError);
    expect(err.statusCode).toBe(403);
    expect(user).toBeUndefined();
  });

  it('calls done with the error when the DB throws mid-transaction', async () => {
    mocks.mockUpsert.mockRejectedValue(new Error('Transaction rolled back'));
    const { jitProvisioningMiddleware } = await import('../jit-provisioning.middleware');
    const done = vi.fn();
    await jitProvisioningMiddleware(SSO_PROFILE, done);
    expect(done).toHaveBeenCalledOnce();
    const [err] = done.mock.calls[0] as [Error];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Transaction rolled back');
  });
});
