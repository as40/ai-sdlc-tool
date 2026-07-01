import { create } from 'zustand';

export type UserRole = 'SUPER_ADMIN' | 'WORKSPACE_OWNER' | 'DEVELOPER' | 'VIEWER';
export type AccessLevel = UserRole;

export interface AuthUser {
  sub: string;
  email: string;
  role: UserRole;
  workspaceId?: string;
}

export interface AuthState {
  token: string | null;
  user: AuthUser | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as AuthUser;
  } catch {
    return null;
  }
}

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

export const useAuthStore = create<AuthState>()((set) => ({
  token: storedToken,
  user: storedToken ? parseJwt(storedToken) : null,
  setToken: (token: string) => {
    localStorage.setItem('auth_token', token);
    set({ token, user: parseJwt(token) });
  },
  clearToken: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null });
  },
}));
