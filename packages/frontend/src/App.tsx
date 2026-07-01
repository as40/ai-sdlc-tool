import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import UnauthorizedPage from './pages/UnauthorizedPage';
import WorkspacePage from './pages/WorkspacePage';
import TeamPage from './pages/TeamPage';
import AIConfigPage from './pages/settings/AIConfigPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/auth.store';

const DevAuthPanel = import.meta.env.DEV
  ? lazy(() => import('./components/dev/DevAuthPanel'))
  : null;

const CAN_CREATE = new Set(['WORKSPACE_OWNER', 'SUPER_ADMIN']);

function HomePage() {
  const { user, token, setToken } = useAuthStore();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!user || !token) return;

    setChecking(true);
    fetch('/api/workspaces', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json() as Promise<{ id: string }[]>)
      .then((workspaces) => {
        if (workspaces.length > 0) {
          const dest = CAN_CREATE.has(user.role)
            ? `/workspaces/${workspaces[0].id}/settings/ai-config`
            : `/workspaces/${workspaces[0].id}/team`;
          navigate(dest, { replace: true });
        } else if (CAN_CREATE.has(user.role)) {
          navigate('/workspaces/new', { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [user, token, navigate]);

  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-50">AI SDLC Tool</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {checking ? 'Loading workspace…' : 'No workspace found. Ask an owner to invite you.'}
          </p>
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
        <Route
          path="/workspaces/new"
          element={
            <ProtectedRoute role="DEVELOPER">
              <WorkspacePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/team"
          element={
            <ProtectedRoute role="DEVELOPER">
              <TeamPage workspaceId="" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspaces/:id/settings/ai-config"
          element={
            <ProtectedRoute role="WORKSPACE_OWNER">
              <AIConfigPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
