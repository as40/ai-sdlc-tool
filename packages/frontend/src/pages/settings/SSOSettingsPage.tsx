import { useState } from 'react';
import SSOConfigForm from '../../components/settings/SSOConfigForm';

type Tab = 'oidc' | 'saml';

interface Props {
  workspaceId: string;
}

export default function SSOSettingsPage({ workspaceId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('oidc');

  return (
    <div className="mx-auto max-w-2xl py-10">
      <h1 className="mb-1 text-xl font-semibold text-zinc-50">SSO Configuration</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Connect an enterprise identity provider. Changes take effect immediately.
      </p>

      <div className="mb-6 flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1">
        {(['oidc', 'saml'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition ${
              activeTab === tab ? 'bg-zinc-700 text-zinc-50' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-400">
          {activeTab === 'oidc' ? 'OpenID Connect (Okta, Azure AD, Google)' : 'SAML 2.0'}
        </h2>
        <SSOConfigForm workspaceId={workspaceId} provider={activeTab} onSaved={() => {}} />
      </div>
    </div>
  );
}
