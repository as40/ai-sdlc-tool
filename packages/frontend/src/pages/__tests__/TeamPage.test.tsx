import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TeamPage from '../TeamPage';
import * as authStore from '../../store/auth.store';

vi.mock('../../store/auth.store', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    getState: () => ({ token: 'mock-token', clearToken: vi.fn() }),
  }),
}));

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

  it('shows success alert after successful invite', async () => {
    mockAuth('WORKSPACE_OWNER');
    vi.mocked(fetch).mockImplementation(() =>
      Promise.resolve({ ok: true, json: async () => ({}) } as Response),
    );

    render(<TeamPage workspaceId="ws-001" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(screen.getByText('Invitation sent.')).toBeInTheDocument();
    });
  });

  it('shows error alert when invite fails', async () => {
    mockAuth('WORKSPACE_OWNER');
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Email already invited' }),
    } as Response);

    render(<TeamPage workspaceId="ws-001" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dup@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(screen.getByText('Email already invited')).toBeInTheDocument();
    });
  });

  it('renders member list returned after invite', async () => {
    mockAuth('WORKSPACE_OWNER');
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = input.toString();
      if (url.includes('/invites') && init?.method === 'POST') {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          members: [
            { id: 'm1', userId: 'user-two', accessLevel: 'DEVELOPER', createdAt: '2026-01-01' },
          ],
        }),
      } as Response);
    });

    render(<TeamPage workspaceId="ws-001" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(screen.getByText(/user-two/)).toBeInTheDocument();
    });
  });

  it('shows remove button for manageable members and calls DELETE', async () => {
    mockAuth('WORKSPACE_OWNER');
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url = input.toString();
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      if (url.includes('/invites')) {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          members: [
            { id: 'm1', userId: 'other-user', accessLevel: 'DEVELOPER', createdAt: '2026-01-01' },
          ],
        }),
      } as Response);
    });

    render(<TeamPage workspaceId="ws-001" />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'dev@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send Invite' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/workspaces/ws-001/members/other-user',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
