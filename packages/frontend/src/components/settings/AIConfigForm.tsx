import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { FormMessage } from '../ui/form-message';

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
      <div className="space-y-1">
        <Label htmlFor="ai-provider">Provider</Label>
        <Select
          id="ai-provider"
          value={form.provider}
          onChange={(e) => handleChange('provider', e.target.value as Provider)}
        >
          {PROVIDERS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="ai-model-name">Model name</Label>
        <Input
          id="ai-model-name"
          type="text"
          value={form.modelName}
          onChange={(e) => handleChange('modelName', e.target.value)}
          placeholder="e.g. claude-sonnet-4-6"
          required
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="ai-api-key">API key{form.isLocal ? ' (optional for local)' : ' *'}</Label>
        <Input
          id="ai-api-key"
          type="password"
          value={form.apiKey}
          onChange={(e) => handleChange('apiKey', e.target.value)}
          placeholder="Write-only — stored encrypted"
          autoComplete="new-password"
        />
      </div>

      {showBaseUrl && (
        <div className="space-y-1">
          <Label htmlFor="ai-base-url">Base URL</Label>
          <Input
            id="ai-base-url"
            type="text"
            value={form.baseUrl}
            onChange={(e) => handleChange('baseUrl', e.target.value)}
            placeholder="e.g. http://localhost:11434"
          />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Checkbox
          id="ai-is-local"
          checked={form.isLocal}
          onChange={(e) => handleChange('isLocal', e.target.checked)}
        />
        <Label htmlFor="ai-is-local" className="text-sm text-zinc-400">
          Local / self-hosted model
        </Label>
      </div>

      {error && <FormMessage>{error}</FormMessage>}

      <Button type="submit" disabled={loading || !form.modelName.trim()}>
        {loading ? 'Saving…' : 'Add Configuration'}
      </Button>
    </form>
  );
}
