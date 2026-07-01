import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceError } from '../workspace.errors';
import type { WorkspaceMemberRecord, WorkspaceRecord } from '../workspace.types';

const WORKSPACE_STUB: WorkspaceRecord = {
  id: 'ws-001',
  name: 'Acme Corp',
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

const mockRepo = vi.hoisted(() => ({
  createWithOwner: vi.fn(),
  findById: vi.fn(),
  findAllForUser: vi.fn(),
  findMember: vi.fn(),
  findAllMembers: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  findUserByEmail: vi.fn(),
}));

vi.mock('../workspace.repository', () => ({
  workspaceRepository: mockRepo,
}));

describe('WorkspaceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('returns workspace and owner member record', async () => {
      mockRepo.createWithOwner.mockResolvedValue({
        workspace: WORKSPACE_STUB,
        member: MEMBER_STUB,
      });
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      const result = await svc.createWorkspace('Acme Corp', 'user-001');
      expect(result.workspace.name).toBe('Acme Corp');
      expect(result.member.accessLevel).toBe('WORKSPACE_OWNER');
      expect(mockRepo.createWithOwner).toHaveBeenCalledWith('Acme Corp', 'user-001');
    });
  });

  describe('listWorkspaces', () => {
    it('returns workspaces for the given user', async () => {
      mockRepo.findAllForUser.mockResolvedValue([WORKSPACE_STUB]);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      const result = await svc.listWorkspaces('user-001');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ws-001');
    });
  });

  describe('getWorkspace', () => {
    it('returns the workspace when found', async () => {
      mockRepo.findById.mockResolvedValue(WORKSPACE_STUB);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      const result = await svc.getWorkspace('ws-001');
      expect(result.id).toBe('ws-001');
    });

    it('throws 404 ServiceError when workspace does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      await expect(svc.getWorkspace('nonexistent')).rejects.toThrow(ServiceError);
      await expect(svc.getWorkspace('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('inviteUser', () => {
    it('adds user to workspace when they exist and are not yet a member', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ id: 'user-002' });
      mockRepo.findMember.mockResolvedValue(null);
      const invitedMember: WorkspaceMemberRecord = {
        ...MEMBER_STUB,
        id: 'mem-002',
        userId: 'user-002',
        accessLevel: 'DEVELOPER',
      };
      mockRepo.addMember.mockResolvedValue(invitedMember);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      const result = await svc.inviteUser('ws-001', 'dev@example.com', 'DEVELOPER');
      expect(result.userId).toBe('user-002');
      expect(result.accessLevel).toBe('DEVELOPER');
      expect(mockRepo.addMember).toHaveBeenCalledWith('ws-001', 'user-002', 'DEVELOPER');
    });

    it('throws 404 when invited email is not in users table', async () => {
      mockRepo.findUserByEmail.mockResolvedValue(null);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      await expect(svc.inviteUser('ws-001', 'ghost@example.com', 'VIEWER')).rejects.toThrow(
        ServiceError,
      );
      await expect(svc.inviteUser('ws-001', 'ghost@example.com', 'VIEWER')).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('throws 409 when user is already a member', async () => {
      mockRepo.findUserByEmail.mockResolvedValue({ id: 'user-002' });
      mockRepo.findMember.mockResolvedValue(MEMBER_STUB);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      await expect(svc.inviteUser('ws-001', 'dev@example.com', 'DEVELOPER')).rejects.toThrow(
        ServiceError,
      );
      await expect(svc.inviteUser('ws-001', 'dev@example.com', 'DEVELOPER')).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe('removeMember', () => {
    it('removes the target member from the workspace', async () => {
      mockRepo.removeMember.mockResolvedValue(undefined);
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      await svc.removeMember('ws-001', 'user-002', 'user-001');
      expect(mockRepo.removeMember).toHaveBeenCalledWith('ws-001', 'user-002');
    });

    it('throws 400 when the requesting user tries to remove themselves', async () => {
      const { WorkspaceService } = await import('../workspace.service');
      const svc = new WorkspaceService(mockRepo);
      await expect(svc.removeMember('ws-001', 'user-001', 'user-001')).rejects.toThrow(
        ServiceError,
      );
      await expect(svc.removeMember('ws-001', 'user-001', 'user-001')).rejects.toMatchObject({
        statusCode: 400,
      });
      expect(mockRepo.removeMember).not.toHaveBeenCalled();
    });
  });
});
