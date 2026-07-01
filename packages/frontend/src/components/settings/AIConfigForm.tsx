import { useState } from 'react';

const PROVIDERS = ['Anthropic', 'OpenAI', 'Azure OpenAI', 'Custom/Local'] as const;
type Provider = (typeof PROVIDERS)[number];

interface AIConfigFormData {
  provider: Provider;
  modelName: string;
  apiKey: string;
  baseUrl: string;
  isLocal: boolean;
}

interface Props {
  workspaceId: string;
  token: string | null;
  onSuccess: () => void;
}

export default function AIConfigForm({ workspaceId, token, onSuccess }: Props) {
  const [form, setForm] = useState<AIConfigFormData>({
    provider: 'Anthropic',
    modelName: '',
    apiKey: '',
    baseUrl: '',
    isLocal: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleChange<K extends keyof AIConfigFormData>(key: K, value: AIConfigFormData[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'provider' && value === 'Custom/Local') {
        next.isLocal = true;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.isLocal && !form.apiKey.trim()) {
      setError('API key is required for cloud providers.');
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        provider: form.provider,
        modelName: form.modelName.trim(),
        isLocal: form.isLocal,
      };
      if (form.apiKey.trim()) body['apiKey'] = form.apiKey.trim();
      if (form.baseUrl.trim()) body['baseUrl'] = form.baseUrl.trim();

      const res = await fetch(`/api/workspaces/${workspaceId}/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { detail?: string };
        throw new Error(data.detail ?? 'Failed to save configuration.');
      }

      setForm({ provider: 'Anthropic', modelName: '', apiKey: '', baseUrl: '', isLocal: false });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const showBaseUrl = form.isLocal || form.provider === 'Azure OpenAI';

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="ai-provider" className="block text-sm text-zinc-400">
          Provider
        </label>
        <select
          id="ai-provider"
          value={form.provider}
          onChange={(e) => handleChange('provider', e.target.value as Provider)}
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50"
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="ai-model-name" className="block text-sm text-zinc-400">
          Model name
        </label>
        <input
          id="ai-model-name"
          type="text"
          value={form.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          placeholder="e.g. claude-sonnet-4-6"
          required
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500"
        />
      </div>

      <div>
        <label htmlFor="ai-api-key" className="block text-sm text-zinc-400">
          API key{form.isLocal ? ' (optional for local)' : ' *'}
        </label>
        <input
          id="ai-api-key"
          type="password"
          value={form.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Write-only — stored encrypted"
          autoComplete="new-password"
          className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500"
        />
      </div>

      {showBaseUrl && (
        <div>
          <label htmlFor="ai-base-url" className="block text-sm text-zinc-400">
            Base URL
          </label>
          <input
            id="ai-base-url"
            type="text"
            value={form.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            placeholder="e.g. http://localhost:11434"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-zinc-500"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          id="ai-is-local"
          type="checkbox"
          checked={form.isLocal}
          onChange={(e) => handleChange('isLocal', e.target.checked)}
          className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 accent-indigo-500"
        />
        <label htmlFor="ai-is-local" className="text-sm text-zinc-400">
          Local / self-hosted model
        </label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !form.modelName.trim()}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Add Configuration'}
      </button>
    </form>
  );
}
