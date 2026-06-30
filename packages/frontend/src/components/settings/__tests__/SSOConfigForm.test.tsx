import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SSOConfigForm from '../SSOConfigForm';

const WORKSPACE_ID = 'ws-test-123';

describe('SSOConfigForm', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // ── Rendering ──────────────────────────────────────────────────────────────

  describe('OIDC provider', () => {
    it('renders all OIDC field labels', () => {
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);
      expect(screen.getByText('Client ID')).toBeInTheDocument();
      expect(screen.getByText('Client Secret')).toBeInTheDocument();
      expect(screen.getByText('Issuer URL')).toBeInTheDocument();
      expect(screen.getByText('Authorization URL')).toBeInTheDocument();
      expect(screen.getByText('Token URL')).toBeInTheDocument();
      expect(screen.getByText('UserInfo URL')).toBeInTheDocument();
      expect(screen.getByText('Redirect URI')).toBeInTheDocument();
    });

    it('does not render SAML fields', () => {
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);
      expect(screen.queryByText('Entry Point URL')).not.toBeInTheDocument();
      expect(screen.queryByText('Certificate (PEM)')).not.toBeInTheDocument();
    });

    it('renders Save and Test Connection buttons', () => {
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
    });
  });

  describe('SAML provider', () => {
    it('renders all SAML field labels', () => {
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="saml" />);
      expect(screen.getByText('Entry Point URL')).toBeInTheDocument();
      expect(screen.getByText('Issuer')).toBeInTheDocument();
      expect(screen.getByText('Certificate (PEM)')).toBeInTheDocument();
    });

    it('does not render OIDC fields', () => {
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="saml" />);
      expect(screen.queryByText('Client ID')).not.toBeInTheDocument();
      expect(screen.queryByText('Redirect URI')).not.toBeInTheDocument();
    });
  });

  // ── Save behaviour ─────────────────────────────────────────────────────────

  describe('save', () => {
    it('POSTs to the correct endpoint with provider=oidc', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal('fetch', mockFetch);
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/auth/sso/config?workspaceId=${WORKSPACE_ID}`,
          expect.objectContaining({ method: 'POST' }),
        );
        const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as { provider: string };
        expect(body.provider).toBe('oidc');
      });
    });

    it('POSTs with provider=saml for SAML form', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal('fetch', mockFetch);
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="saml" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        const body = JSON.parse(mockFetch.mock.calls[0][1].body as string) as { provider: string };
        expect(body.provider).toBe('saml');
      });
    });

    it('includes Authorization header with token from localStorage', async () => {
      localStorage.setItem('auth_token', 'test-jwt');
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
      vi.stubGlobal('fetch', mockFetch);
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        const opts = mockFetch.mock.calls[0][1] as RequestInit;
        expect((opts.headers as Record<string, string>)['Authorization']).toBe('Bearer test-jwt');
      });
      localStorage.removeItem('auth_token');
    });

    it('shows success message after a 200 response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Configuration saved successfully.')).toBeInTheDocument();
      });
    });

    it('shows error detail returned by the server', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, json: async () => ({ detail: 'Invalid config' }) }),
      );
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Invalid config')).toBeInTheDocument();
      });
    });

    it('shows error message when fetch throws', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const { container } = render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('calls onSaved callback after successful save', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
      const onSaved = vi.fn();
      const { container } = render(
        <SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" onSaved={onSaved} />,
      );

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(onSaved).toHaveBeenCalledOnce();
      });
    });
  });

  // ── Test Connection ────────────────────────────────────────────────────────

  describe('test connection', () => {
    it('opens a popup to the OIDC initiation URL', () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="oidc" />);

      fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

      expect(openSpy).toHaveBeenCalledWith(
        `/api/auth/oidc?workspaceId=${WORKSPACE_ID}`,
        'sso-test',
        'width=600,height=700',
      );
    });

    it('uses the saml path for SAML provider', () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
      render(<SSOConfigForm workspaceId={WORKSPACE_ID} provider="saml" />);

      fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

      expect(openSpy).toHaveBeenCalledWith(
        `/api/auth/saml?workspaceId=${WORKSPACE_ID}`,
        'sso-test',
        'width=600,height=700',
      );
    });
  });
});
