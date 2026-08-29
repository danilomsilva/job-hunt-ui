import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { restoreSession, setOnSessionExpired } from '../lib/api';
import { loadSession } from '../lib/tokens';
import { AuthContext, type AuthContextValue, type AuthStatus, type AuthUser } from './AuthContext';
import { loginRequest, logoutRequest, registerRequest } from './authApi';
import type { Credentials } from './schemas';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    loadSession() === null ? 'unauthenticated' : 'loading',
  );

  // On startup, try to trade a persisted refresh token for a live session.
  // (No stored token → we already started at 'unauthenticated', nothing to do.)
  useEffect(() => {
    const session = loadSession();
    if (session === null) return;

    let cancelled = false;
    void restoreSession().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setUser({ email: session.email });
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // A failed refresh mid-session ends things — drop our state to match.
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
      setStatus('unauthenticated');
    });
    return () => {
      setOnSessionExpired(null);
    };
  }, []);

  const login = useCallback(async (credentials: Credentials) => {
    await loginRequest(credentials);
    setUser({ email: credentials.email });
    setStatus('authenticated');
  }, []);

  const register = useCallback(
    async (credentials: Credentials) => {
      await registerRequest(credentials);
      await login(credentials);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
