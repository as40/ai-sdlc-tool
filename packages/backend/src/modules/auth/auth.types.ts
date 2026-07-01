export type UserRole = 'SUPER_ADMIN' | 'WORKSPACE_OWNER' | 'DEVELOPER' | 'VIEWER';
export type AccessLevel = UserRole;

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
}
