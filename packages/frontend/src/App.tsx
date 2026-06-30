import { lazy, Suspense, useState } from 'react';

const DevAuthPanel = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DevAuthPanel'))
  : null;

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('auth_token'));

  if (isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-50">AI SDLC Tool</h1>
          <p className="mt-2 text-sm text-zinc-400">Workspace loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-50">AI SDLC Tool</h1>
          <p className="mt-2 text-sm text-zinc-400">Sign in to continue</p>
        </div>
        {DevAuthPanel && (
          <Suspense fallback={null}>
            <DevAuthPanel onLogin={() => setIsLoggedIn(true)} />
          </Suspense>
        )}
      </div>
    </div>
  );
}
