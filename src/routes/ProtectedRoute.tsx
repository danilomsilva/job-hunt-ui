import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Gates a route on an authenticated session. While the startup refresh check
 * is still running we render nothing meaningful; once it settles we either
 * show the route or bounce to `/login`, remembering where the user was headed
 * so login can send them back.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <p className="p-8 text-sm text-slate-500">Loading…</p>;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
