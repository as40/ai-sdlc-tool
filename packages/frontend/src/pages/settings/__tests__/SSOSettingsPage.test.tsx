import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SSOSettingsPage from '../SSOSettingsPage';

describe('SSOSettingsPage', () => {
  beforeEach(() => {
    // SSOConfigForm's fetch calls must not throw if triggered accidentally
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the page heading', () => {
    render(<SSOSettingsPage workspaceId="ws-123" />);
    expect(screen.getByText('SSO Configuration')).toBeInTheDocument();
  });

  it('shows OIDC and SAML tab buttons', () => {
    render(<SSOSettingsPage workspaceId="ws-123" />);
    expect(screen.getByRole('button', { name: 'OIDC' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SAML' })).toBeInTheDocument();
  });

  it('displays the OIDC form by default', () => {
    render(<SSOSettingsPage workspaceId="ws-123" />);
    expect(screen.getByText('OpenID Connect (Okta, Azure AD, Google)')).toBeInTheDocument();
    expect(screen.getByText('Client ID')).toBeInTheDocument();
  });

  it('switches to the SAML form when SAML tab is clicked', () => {
    render(<SSOSettingsPage workspaceId="ws-123" />);

    fireEvent.click(screen.getByRole('button', { name: 'SAML' }));

    expect(screen.getByText('SAML 2.0')).toBeInTheDocument();
    expect(screen.getByText('Entry Point URL')).toBeInTheDocument();
    expect(screen.queryByText('Client ID')).not.toBeInTheDocument();
  });

  it('switches back to OIDC when OIDC tab is re-clicked', () => {
    render(<SSOSettingsPage workspaceId="ws-123" />);

    fireEvent.click(screen.getByRole('button', { name: 'SAML' }));
    fireEvent.click(screen.getByRole('button', { name: 'OIDC' }));

    expect(screen.getByText('OpenID Connect (Okta, Azure AD, Google)')).toBeInTheDocument();
    expect(screen.queryByText('Entry Point URL')).not.toBeInTheDocument();
  });

  it('passes the workspaceId down to the form', () => {
    vi.stubGlobal('open', vi.fn());
    render(<SSOSettingsPage workspaceId="ws-abc" />);

    // Trigger Test Connection — the URL must contain the workspaceId
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    fireEvent.click(screen.getByRole('button', { name: /test connection/i }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('workspaceId=ws-abc'),
      expect.any(String),
      expect.any(String),
    );
  });
});
