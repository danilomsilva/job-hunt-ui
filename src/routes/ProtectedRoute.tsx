import { useEffect, useRef, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Gates a route on an authenticated session. While the startup refresh check
 * is still running we render a minimal `<main>` landmark; once it settles we
 * either show the route or bounce to `/login`, remembering where the user was
 * headed so login can send them back.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();
  const prevStatus = useRef(status);

  // `useRouteFocus` only fires on a pathname change, so a deep link whose
  // startup refresh took a moment would never get the focus move. Do it here
  // when auth resolves from the loading state.
  useEffect(() => {
    if (prevStatus.current === 'loading' && status === 'authenticated') {
      document.getElementById('main')?.focus();
    }
    prevStatus.current = status;
  }, [status]);

  if (status === 'loading') {
    return (
      <main id="main" tabIndex={-1} className="p-8 outline-none">
        <p role="status" className="text-sm text-slate-500">
          Loading…
        </p>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
