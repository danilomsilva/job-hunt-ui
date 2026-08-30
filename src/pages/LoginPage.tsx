import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/useAuth';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useDocumentTitle('Log in');

  // ProtectedRoute stashes the full location it bounced from; keep its query
  // string so a deep link like /applications?status=interview&page=2 survives login.
  const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTo =
    from?.pathname !== undefined ? `${from.pathname}${from.search ?? ''}` : '/applications';

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
