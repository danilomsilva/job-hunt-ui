import { useState, type ReactNode } from 'react';
import { z } from 'zod';
import { ApiError } from '../lib/api';
import { credentialsSchema, type Credentials } from './schemas';

interface FieldErrors {
  email?: string | undefined;
  password?: string | undefined;
}

interface CredentialsFormProps {
  heading: string;
  intro: string;
  submitLabel: string;
  pendingLabel: string;
  passwordAutoComplete: 'current-password' | 'new-password';
  onSubmit: (credentials: Credentials) => Promise<void>;
  footer: ReactNode;
}

/**
 * The email + password form shared by login and register. Owns field state,
 * client-side validation against the shared Zod schema, and turning a rejected
 * `onSubmit` into a form-level message; the parent decides what submitting
 * actually does and where to go next.
 */
export function CredentialsForm({
  heading,
  intro,
  submitLabel,
  pendingLabel,
  passwordAutoComplete,
  onSubmit,
  footer,
}: CredentialsFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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
      await onSubmit(parsed.data);
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
        <h1 className="text-xl font-semibold text-slate-900">{heading}</h1>
        <p className="mt-1 text-sm text-slate-500">{intro}</p>

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
          autoComplete={passwordAutoComplete}
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
          {pending ? pendingLabel : submitLabel}
        </button>

        <p className="mt-4 text-sm text-slate-500">{footer}</p>
      </form>
    </main>
  );
}
