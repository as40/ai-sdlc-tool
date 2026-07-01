import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import TeamPage from '../TeamPage';
import * as authStore from '../../store/auth.store';

vi.mock('../../store/auth.store', () => ({ useAuthStore: vi.fn() }));

const mockUseAuthStore = vi.mocked(authStore.useAuthStore);

function mockAuth(role: authStore.UserRole = 'DEVELOPER') {
  const state: authStore.AuthState = {
    token: 'mock-token',
    user: { sub: 'u1', email: 'u@test.com', role },
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
  mockUseAuthStore.mockImplementation((selector: (s: authStore.AuthState) => unknown) =>
    selector(state),
  );
}

describe('TeamPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the team heading', () => {
    mockAuth('DEVELOPER');
    render(<TeamPage workspaceId="ws-001" />);
    expect(screen.getByRole('heading', { name: 'Team Members' })).toBeInTheDocument();
  });

  it('shows invite form for WORKSPACE_OWNER', () => {
    mockAuth('WORKSPACE_OWNER');
    render(<TeamPage workspaceId="ws-001" />);
    expect(screen.getByText('Invite Member')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send Invite' })).toBeInTheDocument();
  });

  it('hides invite form for DEVELOPER', () => {
    mockAuth('DEVELOPER');
    render(<TeamPage workspaceId="ws-001" />);
    expect(screen.queryByText('Invite Member')).not.toBeInTheDocument();
  });

  it('shows invite form for SUPER_ADMIN', () => {
    mockAuth('SUPER_ADMIN');
    render(<TeamPage workspaceId="ws-001" />);
    expect(screen.getByText('Invite Member')).toBeInTheDocument();
  });
});
