import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/useAuth';

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectState = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = redirectState?.from?.pathname ?? '/applications';

  if (status === 'authenticated') {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <CredentialsForm
      heading="Log in"
      intro="Welcome back to job-hunt."
      submitLabel="Log in"
      pendingLabel="Logging in…"
      passwordAutoComplete="current-password"
      onSubmit={async (credentials) => {
        await login(credentials);
        void navigate(redirectTo, { replace: true });
      }}
      footer={
        <>
          Need an account?{' '}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Register
          </Link>
        </>
      }
    />
  );
}
