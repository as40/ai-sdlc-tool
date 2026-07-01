import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import * as authStoreModule from '../../../store/auth.store';
import type { AuthUser, AuthState } from '../../../store/auth.store';

vi.mock('../../../store/auth.store', async (importOriginal) => {
  const original = await importOriginal<typeof authStoreModule>();
  return { ...original, useAuthStore: vi.fn() };
});

const mockUseAuthStore = vi.mocked(authStoreModule.useAuthStore);

function setUser(user: AuthUser | null) {
  mockUseAuthStore.mockImplementation((selector: (s: AuthState) => unknown) =>
    selector({
      user,
      token: null,
      setToken: vi.fn(),
      clearToken: vi.fn(),
    }),
  );
}

function renderProtected(requiredRole: authStoreModule.AccessLevel, user: AuthUser | null) {
  setUser(user);
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute role={requiredRole}>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

const makeUser = (role: authStoreModule.UserRole): AuthUser => ({
  sub: 'u1',
  email: 'test@example.com',
  role,
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user role meets requirement', () => {
    renderProtected('WORKSPACE_OWNER', makeUser('WORKSPACE_OWNER'));
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to access a WORKSPACE_OWNER route', () => {
    renderProtected('WORKSPACE_OWNER', makeUser('SUPER_ADMIN'));
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('allows SUPER_ADMIN to access any route', () => {
    renderProtected('SUPER_ADMIN', makeUser('SUPER_ADMIN'));
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects DEVELOPER to /unauthorized when WORKSPACE_OWNER is required', () => {
    renderProtected('WORKSPACE_OWNER', makeUser('DEVELOPER'));
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects VIEWER to /unauthorized when DEVELOPER is required', () => {
    renderProtected('DEVELOPER', makeUser('VIEWER'));
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /unauthorized', () => {
    renderProtected('WORKSPACE_OWNER', null);
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});
