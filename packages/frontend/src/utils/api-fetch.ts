import { useAuthStore } from '../store/auth.store';

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const { token, clearToken } = useAuthStore.getState();

  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    window.location.replace('/');
    // Return a never-resolving promise so callers don't process the response
    // while the page is navigating away.
    return new Promise<never>(() => {});
  }

  return res;
}
