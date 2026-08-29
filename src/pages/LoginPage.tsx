import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../auth/useAuth';
import { credentialsSchema } from '../auth/schemas';
import { ApiError } from '../lib/api';

interface FieldErrors {
  email?: string | undefined;
  password?: string | undefined;
}

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectState = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = redirectState?.from?.pathname ?? '/applications';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(): Promise<void> {
    setFormError(null);

    const parsed = credentialsSchema.safeParse({ email, password });
    if (!parsed.success) {
      const { fieldErrors: errors } = z.flattenError(parsed.error);
      setFieldErrors({ email: errors.email?.[0], password: errors.password?.[0] });
      return;
    }
    setFieldErrors({});

    setPending(true);
    try {
      await login(parsed.data);
      void navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        noValidate
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-500">Welcome back to job-hunt.</p>

        {formError !== null && (
          <p role="alert" className="mt-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <label htmlFor="email" className="mt-5 block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          aria-invalid={fieldErrors.email !== undefined}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {fieldErrors.email !== undefined && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
        )}

        <label htmlFor="password" className="mt-4 block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          aria-invalid={fieldErrors.password !== undefined}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {fieldErrors.password !== undefined && (
          <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? 'Logging in…' : 'Log in'}
        </button>

        <p className="mt-4 text-sm text-slate-500">
          Need an account?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}
