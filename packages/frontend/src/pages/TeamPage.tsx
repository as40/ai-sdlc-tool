import { useState } from 'react';
import { useAuthStore } from '../store/auth.store';

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
  const token = useAuthStore((s) => s.token);
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
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
      const res = await fetch(`/api/workspaces/${workspaceId}/members/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
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

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {inviteSuccess && <p className="mb-4 text-sm text-green-400">Invitation sent.</p>}

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
                <button
                  onClick={() => void handleRemove(m.userId)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <form onSubmit={(e) => void handleInvite(e)} className="max-w-sm space-y-3">
          <h2 className="text-lg font-medium text-zinc-50">Invite Member</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'DEVELOPER' | 'VIEWER')}
            className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
          >
            <option value="DEVELOPER">Developer</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Inviting…' : 'Send Invite'}
          </button>
        </form>
      )}
    </div>
  );
}
