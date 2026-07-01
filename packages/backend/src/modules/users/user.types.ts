import type { UserRole } from '../auth/auth.types';

export interface SsoProfile {
  email: string;
  displayName: string;
  providerId: string;
}

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  accessLevel: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
