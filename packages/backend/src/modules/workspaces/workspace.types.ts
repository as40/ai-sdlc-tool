import type { UserRole } from '../auth/auth.types';

export interface WorkspaceRecord {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspaceId: string;
  userId: string;
  accessLevel: UserRole;
  createdAt: Date;
}
