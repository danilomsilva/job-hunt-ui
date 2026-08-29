import { Link } from 'react-router-dom';

// Placeholder — the real form (validation, submit, error handling) is next.
export function LoginPage() {
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      <p className="mt-2 text-sm text-slate-500">
        Need an account? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
