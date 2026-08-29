/**
 * Where the client keeps its tokens (decision recorded in docs/ROADMAP.md):
 *
 * - **access token** — in memory only, never persisted. An injected script
 *   can't read it back out of storage, and it dies with the tab.
 * - **refresh token + email** — in `localStorage`, so the session survives a
 *   reload: on startup the app calls `POST /auth/refresh` with the stored
 *   token to mint a fresh access token. Refresh tokens rotate on every use,
 *   so a stale copy left in storage is single-use.
 *
 * The email rides along because job-hunt-api has no `/auth/me` and its access
 * token carries only `sub` — it's the only way to show "signed in as …" after
 * a reload.
 */
import { z } from 'zod';

const STORAGE_KEY = 'job-hunt-ui.session';

const persistedSessionSchema = z.object({
  refreshToken: z.string().min(1),
  email: z.string().min(1),
});

export type PersistedSession = z.infer<typeof persistedSessionSchema>;

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = persistedSessionSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function saveSession(session: PersistedSession): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  accessToken = null;
  localStorage.removeItem(STORAGE_KEY);
}
