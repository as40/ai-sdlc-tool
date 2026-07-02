import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import WorkspacePage from '../WorkspacePage';
import * as authStore from '../../store/auth.store';

vi.mock('../../store/auth.store', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    getState: () => ({ token: 'mock-token', clearToken: vi.fn() }),
  }),
}));

const mockUseAuthStore = vi.mocked(authStore.useAuthStore);

function mockAuth(token: string | null = 'mock-token') {
  const state: authStore.AuthState = { token, user: null, setToken: vi.fn(), clearToken: vi.fn() };
  mockUseAuthStore.mockImplementation((selector: (s: authStore.AuthState) => unknown) =>
    selector(state),
  );
}

function renderPage() {
  return render(
    <MemoryRouter>
      <WorkspacePage />
    </MemoryRouter>,
  );
}

describe('WorkspacePage', () => {
  beforeEach(() => {
    mockAuth();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders the page heading and form', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Create Workspace' })).toBeInTheDocument();
    expect(screen.getByLabelText('Workspace name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeInTheDocument();
  });

  it('disables submit button when name is empty', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeDisabled();
  });

  it('enables submit button when name is filled', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Workspace name'), {
      target: { value: 'My Workspace' },
    });
    expect(screen.getByRole('button', { name: 'Create Workspace' })).toBeEnabled();
  });

  it('navigates to ai-config after workspace is created', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'ws-001', name: 'My Workspace' }),
    } as Response);

    renderPage();
    fireEvent.change(screen.getByLabelText('Workspace name'), {
      target: { value: 'My Workspace' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/workspaces',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('shows error message when creation fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ detail: 'Name already taken' }),
    } as Response);

    renderPage();
    fireEvent.change(screen.getByLabelText('Workspace name'), { target: { value: 'Existing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Workspace' }));

    await waitFor(() => {
      expect(screen.getByText('Name already taken')).toBeInTheDocument();
    });
  });
});
