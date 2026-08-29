import { useEffect, useState } from 'react';

interface HealthResponse {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${String(res.status)}`);
        return res.json() as Promise<HealthResponse>;
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      });
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">job-hunt-ui</h1>
        <p className="mt-1 text-sm text-slate-500">Connection to job-hunt-api</p>

        {error && (
          <p className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            Could not reach the API: {error}
          </p>
        )}

        {!error && !health && <p className="mt-4 text-sm text-slate-500">Checking…</p>}

        {health && (
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="font-medium text-slate-700">Status:</dt>
              <dd className="text-green-600">{health.status}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-slate-700">Timestamp:</dt>
              <dd className="text-slate-600">{health.timestamp}</dd>
            </div>
          </dl>
        )}
      </div>
    </main>
  );
}

export default App;
