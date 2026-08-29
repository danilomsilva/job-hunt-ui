import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/useAuth';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Register');

  if (status === 'authenticated') {
    return <Navigate to="/applications" replace />;
  }

  return (
    <CredentialsForm
      heading="Create your account"
      intro="Start tracking your job hunt."
      submitLabel="Create account"
      pendingLabel="Creating account…"
      passwordAutoComplete="new-password"
      onSubmit={async (credentials) => {
        // register() also logs in — job-hunt-api's register returns no tokens.
        await register(credentials);
        void navigate('/applications', { replace: true });
      }}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-slate-900 underline">
            Log in
          </Link>
        </>
      }
    />
  );
}
