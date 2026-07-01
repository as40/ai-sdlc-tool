import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { FormMessage } from '../ui/form-message';

type Provider = 'oidc' | 'saml';

interface OidcFields {
  clientId: string;
  clientSecret: string;
  issuer: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri: string;
}

interface SamlFields {
  entryPoint: string;
  certificate: string;
  issuer: string;
}

interface Props {
  workspaceId: string;
  provider: Provider;
  onSaved?: () => void;
}

const OIDC_DEFAULTS: OidcFields = {
  clientId: '',
  clientSecret: '',
  issuer: '',
  authorizationUrl: '',
  tokenUrl: '',
  userInfoUrl: '',
  redirectUri: `${window.location.origin}/api/auth/oidc/callback`,
};

const SAML_DEFAULTS: SamlFields = { entryPoint: '', certificate: '', issuer: '' };

export default function SSOConfigForm({ workspaceId, provider, onSaved }: Props) {
  const [oidc, setOidc] = useState<OidcFields>(OIDC_DEFAULTS);
  const [saml, setSaml] = useState<SamlFields>(SAML_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const config = provider === 'oidc' ? oidc : saml;

    try {
      const res = await fetch(
        `/api/auth/sso/config?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token') ?? ''}`,
          },
          body: JSON.stringify({ provider, config }),
        },
      );
      if (!res.ok) {
        const body = (await res.json()) as { detail?: string };
        throw new Error(body.detail ?? 'Save failed');
      }
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }

  function handleTestConnection() {
    const url = `/api/auth/${provider}?workspaceId=${encodeURIComponent(workspaceId)}`;
    window.open(url, 'sso-test', 'width=600,height=700');
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
      {provider === 'oidc' ? (
        <>
          {(
            [
              ['clientId', 'Client ID'],
              ['clientSecret', 'Client Secret'],
              ['issuer', 'Issuer URL'],
              ['authorizationUrl', 'Authorization URL'],
              ['tokenUrl', 'Token URL'],
              ['userInfoUrl', 'UserInfo URL'],
              ['redirectUri', 'Redirect URI'],
            ] as [keyof OidcFields, string][]
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs font-medium text-zinc-300">{label}</Label>
              <Input
                type={key === 'clientSecret' ? 'password' : 'text'}
                value={oidc[key]}
                onChange={(e) => setOidc((prev) => ({ ...prev, [key]: e.target.value }))}
                className="py-1.5 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          ))}
        </>
      ) : (
        <>
          {(
            [
              ['entryPoint', 'Entry Point URL'],
              ['issuer', 'Issuer'],
            ] as [keyof SamlFields, string][]
          ).map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs font-medium text-zinc-300">{label}</Label>
              <Input
                type="text"
                value={saml[key]}
                onChange={(e) => setSaml((prev) => ({ ...prev, [key]: e.target.value }))}
                className="py-1.5 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs font-medium text-zinc-300">Certificate (PEM)</Label>
            <Textarea
              value={saml.certificate}
              onChange={(e) => setSaml((prev) => ({ ...prev, certificate: e.target.value }))}
              rows={6}
              className="font-mono text-xs focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </>
      )}

      {error && <FormMessage>{error}</FormMessage>}
      {success && <FormMessage variant="success">Configuration saved successfully.</FormMessage>}

      <div className="flex gap-3">
        <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-500">
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="outline" onClick={handleTestConnection}>
          Test Connection
        </Button>
      </div>
    </form>
  );
}
