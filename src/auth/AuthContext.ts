import { createContext } from 'react';
import type { Credentials } from './schemas';

export interface AuthUser {
  email: string;
}

/** `loading` covers the startup refresh-token check, before we know either way. */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  login: (credentials: Credentials) => Promise<void>;
  register: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
