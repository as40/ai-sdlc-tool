import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Alert } from '../components/ui/alert';
import { apiFetch } from '../utils/api-fetch';

interface Member {
  id: string;
  userId: string;
  accessLevel: string;
  createdAt: string;
}

interface Props {
  workspaceId: string;
}

export default function TeamPage({ workspaceId }: Props) {
  const user = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'DEVELOPER' | 'VIEWER'>('DEVELOPER');
  const [error, setError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const canManage = user?.role === 'WORKSPACE_OWNER' || user?.role === 'SUPER_ADMIN';

  async function loadMembers() {
    setError(null);
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}`);
      if (!res.ok) throw new Error('Failed to load workspace');
      const data = (await res.json()) as { members?: Member[] };
      setMembers(data.members ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInviteSuccess(false);
    setLoading(true);
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Invite failed');
      }
      setEmail('');
      setInviteSuccess(true);
      await loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(userId: string) {
    setError(null);
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Remove failed');
      }
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-50">Team Members</h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {inviteSuccess && (
        <Alert variant="success" className="mb-4">
          Invitation sent.
        </Alert>
      )}

      {members.length > 0 && (
        <ul className="mb-8 space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded border border-zinc-800 px-4 py-2 text-sm text-zinc-300"
            >
              <span>
                {m.userId} — <span className="text-zinc-400">{m.accessLevel}</span>
              </span>
              {canManage && m.userId !== user?.sub && (
                <Button variant="destructive" size="sm" onClick={() => void handleRemove(m.userId)}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={(e) => void handleInvite(e)} className="max-w-sm space-y-3">
          <h2 className="text-lg font-medium text-zinc-50">Invite Member</h2>
          <div className="space-y-1">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'DEVELOPER' | 'VIEWER')}
            >
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Inviting…' : 'Send Invite'}
          </Button>
        </form>
      )}
    </div>
  );
}
