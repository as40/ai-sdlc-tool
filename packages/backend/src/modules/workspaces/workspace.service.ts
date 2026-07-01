import { workspaceRepository, type WorkspaceRepository } from './workspace.repository';
import type { WorkspaceMemberRecord, WorkspaceRecord } from './workspace.types';
import { ServiceError } from './workspace.errors';
export { ServiceError } from './workspace.errors';

export class WorkspaceService {
  constructor(private readonly repo: WorkspaceRepository) {}

  async createWorkspace(
    name: string,
    creatorId: string,
  ): Promise<{ workspace: WorkspaceRecord; member: WorkspaceMemberRecord }> {
    return this.repo.createWithOwner(name, creatorId);
  }

  async listWorkspaces(userId: string): Promise<WorkspaceRecord[]> {
    return this.repo.findAllForUser(userId);
  }

  async getWorkspace(id: string): Promise<WorkspaceRecord> {
    const workspace = await this.repo.findById(id);
    if (!workspace) throw new ServiceError(404, 'Not Found', 'Workspace not found.');
    return workspace;
  }

  async inviteUser(
    workspaceId: string,
    email: string,
    role: 'DEVELOPER' | 'VIEWER',
  ): Promise<WorkspaceMemberRecord> {
    const user = await this.repo.findUserByEmail(email);
    if (!user) {
      throw new ServiceError(404, 'Not Found', 'User not found. They must log in via SSO first.');
    }

    const existing = await this.repo.findMember(workspaceId, user.id);
    if (existing) {
      throw new ServiceError(409, 'Conflict', 'User is already a member of this workspace.');
    }

    return this.repo.addMember(workspaceId, user.id, role);
  }

  async removeMember(
    workspaceId: string,
    targetUserId: string,
    requestingUserId: string,
  ): Promise<void> {
    if (targetUserId === requestingUserId) {
      throw new ServiceError(400, 'Bad Request', 'Cannot remove yourself from the workspace.');
    }
    await this.repo.removeMember(workspaceId, targetUserId);
  }
}

export const workspaceService = new WorkspaceService(workspaceRepository);
