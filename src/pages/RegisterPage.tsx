import { Link } from 'react-router-dom';

// Placeholder — the real form (validation, submit, error handling) is next.
export function RegisterPage() {
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold text-slate-900">Register</h1>
      <p className="mt-2 text-sm text-slate-500">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}
