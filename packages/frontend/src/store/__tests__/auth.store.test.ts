import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Token with payload { sub: 'u1', email: 'test@example.com', role: 'WORKSPACE_OWNER' }
const VALID_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ sub: 'u1', email: 'test@example.com', role: 'WORKSPACE_OWNER' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '') +
  '.sig';

// Token with a non-JSON payload (corrupt)
const CORRUPT_TOKEN = 'a.!!notbase64!!.c';

describe('auth.store', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('initializes with null user when localStorage is empty', async () => {
    const { useAuthStore } = await import('../auth.store');
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
  });

  it('parses token from localStorage on initialization', async () => {
    localStorage.setItem('auth_token', VALID_TOKEN);
    const { useAuthStore } = await import('../auth.store');
    const { user } = useAuthStore.getState();
    expect(user).not.toBeNull();
    expect(user?.role).toBe('WORKSPACE_OWNER');
    expect(user?.email).toBe('test@example.com');
  });

  it('setToken updates the store state and persists to localStorage', async () => {
    const { useAuthStore } = await import('../auth.store');
    useAuthStore.getState().setToken(VALID_TOKEN);
    const { user, token } = useAuthStore.getState();
    expect(token).toBe(VALID_TOKEN);
    expect(user?.role).toBe('WORKSPACE_OWNER');
    expect(localStorage.getItem('auth_token')).toBe(VALID_TOKEN);
  });

  it('clearToken removes state and localStorage entry', async () => {
    const { useAuthStore } = await import('../auth.store');
    useAuthStore.getState().setToken(VALID_TOKEN);
    useAuthStore.getState().clearToken();
    const { user, token } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('returns null user for a corrupt token', async () => {
    const { useAuthStore } = await import('../auth.store');
    useAuthStore.getState().setToken(CORRUPT_TOKEN);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
