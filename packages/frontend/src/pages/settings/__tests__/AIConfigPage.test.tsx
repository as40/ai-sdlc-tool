import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIConfigPage from '../AIConfigPage';
import * as authStore from '../../../store/auth.store';

vi.mock('../../../store/auth.store', () => ({ useAuthStore: vi.fn() }));

const mockUseAuthStore = vi.mocked(authStore.useAuthStore);

function mockAuth(token: string | null = 'mock-token') {
  const state: authStore.AuthState = {
    token,
    user: null,
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
  mockUseAuthStore.mockImplementation((selector: (s: authStore.AuthState) => unknown) =>
    selector(state),
  );
}

const CONFIGS = [
  {
    id: 'cfg-001',
    provider: 'Anthropic',
    modelName: 'claude-3-5-sonnet-20241022',
    baseUrl: null,
    isLocal: false,
    createdAt: new Date().toISOString(),
  },
];

describe('AIConfigPage', () => {
  beforeEach(() => {
    mockAuth();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders heading and "Add Configuration" section', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response);

    render(<AIConfigPage workspaceId="ws-001" />);

    expect(screen.getByRole('heading', { name: 'AI Provider Configuration' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Add Configuration' })).toBeInTheDocument();
    });
  });

  it('loads and displays saved configs', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => CONFIGS,
    } as Response);

    render(<AIConfigPage workspaceId="ws-001" />);

    await waitFor(() => {
      expect(screen.getByText('claude-3-5-sonnet-20241022')).toBeInTheDocument();
    });
  });

  it('shows error when config load fails', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    render(<AIConfigPage workspaceId="ws-001" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load configurations.')).toBeInTheDocument();
    });
  });

  it('shows success result after test connection', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => CONFIGS } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, latencyMs: 42 }),
      } as Response);

    render(<AIConfigPage workspaceId="ws-001" />);

    await waitFor(() => screen.getByRole('button', { name: 'Test' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));

    await waitFor(() => {
      expect(screen.getByText(/Connected — 42ms/)).toBeInTheDocument();
    });
  });

  it('removes config from list after delete', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => CONFIGS } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);

    render(<AIConfigPage workspaceId="ws-001" />);

    await waitFor(() => screen.getByRole('button', { name: 'Delete' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(screen.queryByText('claude-3-5-sonnet-20241022')).not.toBeInTheDocument();
    });
  });
});
