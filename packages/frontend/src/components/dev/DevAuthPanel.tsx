import { useState } from 'react';
import { Button } from '../ui/button';
import { FormMessage } from '../ui/form-message';

type Role = 'SUPER_ADMIN' | 'WORKSPACE_OWNER' | 'DEVELOPER' | 'VIEWER';

const ROLES: { role: Role; label: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin' },
  { role: 'WORKSPACE_OWNER', label: 'Workspace Owner' },
  { role: 'DEVELOPER', label: 'Developer' },
  { role: 'VIEWER', label: 'Viewer' },
];

interface Props {
  onLogin?: (token: string) => void;
}

export default function DevAuthPanel({ onLogin }: Props) {
  const [loading, setLoading] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(role: Role) {
    setLoading(role);
    setError(null);
    try {
      const res = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Login failed');
      }
      const { token } = (await res.json()) as { token: string };
      localStorage.setItem('auth_token', token);
      onLogin?.(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-950/30 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-yellow-400">
        Dev Auth — local only
      </p>
      <div className="flex flex-col gap-2">
        {ROLES.map(({ role, label }) => (
          <Button
            key={role}
            variant="warning"
            disabled={loading !== null}
            className="w-full"
            onClick={() => void login(role)}
          >
            {loading === role ? 'Signing in…' : `Login as ${label}`}
          </Button>
        ))}
      </div>
      {error && <FormMessage className="mt-2">{error}</FormMessage>}
    </div>
  );
}
