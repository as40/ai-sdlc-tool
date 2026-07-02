import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { FormMessage } from '../components/ui/form-message';
import { apiFetch } from '../utils/api-fetch';

export default function WorkspacePage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Failed to create workspace');
      }
      const workspace = (await res.json()) as { id: string; name: string };
      navigate(`/workspaces/${workspace.id}/settings/ai-config`);
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
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          {error && <FormMessage>{error}</FormMessage>}
          <Button type="submit" disabled={loading || name.trim().length === 0} className="w-full">
            {loading ? 'Creating…' : 'Create Workspace'}
          </Button>
        </form>
      </div>
    </div>
  );
}
