import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, type AccessLevel } from '../../store/auth.store';

const ROLE_LEVEL: Record<AccessLevel, number> = {
  VIEWER: 0,
  DEVELOPER: 1,
  WORKSPACE_OWNER: 2,
  SUPER_ADMIN: 3,
};

interface Props {
  role: AccessLevel;
  children: ReactNode;
}

export function ProtectedRoute({ role, children }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user || ROLE_LEVEL[user.role] < ROLE_LEVEL[role]) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
