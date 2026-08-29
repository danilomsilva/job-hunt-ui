import { Link, Navigate, useNavigate } from 'react-router-dom';
import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/useAuth';

export function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();

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
