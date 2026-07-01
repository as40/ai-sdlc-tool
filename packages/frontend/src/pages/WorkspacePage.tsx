import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';

export default function WorkspacePage() {
  const token = useAuthStore((s) => s.token);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Failed to create workspace');
      }
      const workspace = (await res.json()) as { id: string; name: string };
      setCreated(workspace);
      setName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 px-4">
        <h1 className="text-2xl font-semibold text-zinc-50">Create Workspace</h1>
        {created && (
          <p className="text-sm text-green-400">
            Workspace &quot;{created.name}&quot; created successfully.
          </p>
        )}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="workspace-name" className="block text-sm text-zinc-400">
              Workspace name
            </label>
            <input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || name.trim().length === 0}
            className="w-full rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create Workspace'}
          </button>
        </form>
      </div>
    </div>
  );
}
