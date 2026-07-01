import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { useAuthStore } from './store/auth.store';

const DevAuthPanel = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DevAuthPanel'))
  : null;

function HomePage() {
  const { user, setToken } = useAuthStore();

  if (user) {
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
            <DevAuthPanel
              onLogin={(token: string) => {
                setToken(token);
              }}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
