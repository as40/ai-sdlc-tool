import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import AIConfigForm from '../../components/settings/AIConfigForm';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

interface AIConfigRecord {
  id: string;
  provider: string;
  modelName: string;
  baseUrl: string | null;
  isLocal: boolean;
  createdAt: string;
}

interface TestResult {
  success: boolean;
  latencyMs: number;
  error?: string;
}

export default function AIConfigPage() {
  const { id: workspaceId = '' } = useParams<{ id: string }>();
  const token = useAuthStore((s) => s.token);
  const [configs, setConfigs] = useState<AIConfigRecord[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const loadConfigs = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load configurations.');
      const data = (await res.json()) as AIConfigRecord[];
      setConfigs(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [workspaceId, token]);

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  async function handleDelete(id: string) {
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai-config/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Delete failed.');
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setDeleting((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleTest(id: string) {
    setTesting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/ai-config/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as TestResult;
      setTestResults((prev) => ({ ...prev, [id]: data }));
    } catch {
      setTestResults((prev) => ({
        ...prev,
        [id]: { success: false, latencyMs: 0, error: 'Request failed.' },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-8">
      <h1 className="mb-8 text-2xl font-semibold text-zinc-50">AI Provider Configuration</h1>

      {loadError && (
        <Alert variant="error" className="mb-4">
          {loadError}
        </Alert>
      )}

      {configs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-medium text-zinc-50">Saved Configurations</h2>
          <ul className="space-y-3">
            {configs.map((cfg) => {
              const result = testResults[cfg.id];
              return (
                <li
                  key={cfg.id}
                  className="rounded border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-zinc-50">{cfg.provider}</span>
                      <span className="ml-2 text-zinc-400">{cfg.modelName}</span>
                      {cfg.isLocal && (
                        <span className="ml-2 rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-300">
                          local
                        </span>
                      )}
                      {cfg.baseUrl && (
                        <span className="ml-2 text-xs text-zinc-500">{cfg.baseUrl}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleTest(cfg.id)}
                        disabled={testing[cfg.id]}
                      >
                        {testing[cfg.id] ? 'Testing…' : 'Test'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => void handleDelete(cfg.id)}
                        disabled={deleting[cfg.id]}
                      >
                        {deleting[cfg.id] ? 'Deleting…' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                  {result && (
                    <p
                      className={`mt-2 text-xs ${result.success ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {result.success
                        ? `Connected — ${result.latencyMs}ms`
                        : `Failed: ${result.error ?? 'Unknown error'}`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-lg font-medium text-zinc-50">Add Configuration</h2>
        <div className="max-w-sm">
          <AIConfigForm
            workspaceId={workspaceId}
            token={token}
            onSuccess={() => void loadConfigs()}
          />
        </div>
      </section>
    </div>
  );
}
