/**
 * Thin wrappers over job-hunt-api's `/auth` endpoints. No React here — the
 * AuthProvider composes these with component state.
 */
import { apiFetch } from '../lib/api';
import { clearSession, loadSession, saveSession, setAccessToken } from '../lib/tokens';
import type { TokenPair, UserResponse } from '../lib/types';
import type { Credentials } from './schemas';

export async function loginRequest(credentials: Credentials): Promise<void> {
  const tokens = await apiFetch<TokenPair>('/auth/login', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
  setAccessToken(tokens.accessToken);
  saveSession({ refreshToken: tokens.refreshToken, email: credentials.email });
}

/**
 * Register returns the new user, not a token pair (see job-hunt-api's
 * `routes/auth.ts`) — the caller logs in straight afterwards.
 */
export async function registerRequest(credentials: Credentials): Promise<UserResponse> {
  return apiFetch<UserResponse>('/auth/register', {
    method: 'POST',
    body: credentials,
    auth: false,
  });
}

export async function logoutRequest(): Promise<void> {
  const session = loadSession();
  if (session !== null) {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
        auth: false,
      });
    } catch {
      // Best effort: we clear local state regardless of what the server says.
    }
  }
  clearSession();
}
