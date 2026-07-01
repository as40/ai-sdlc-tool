export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-950">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-red-400">Access Denied</h1>
        <p className="mt-2 text-sm text-zinc-400">You do not have permission to view this page.</p>
      </div>
    </div>
  );
}
