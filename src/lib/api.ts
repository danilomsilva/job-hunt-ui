/**
 * The one place the app talks to job-hunt-api. Attaches the bearer token,
 * normalises every error into an `ApiError`, and — on a `401` — transparently
 * refreshes the access token once and retries the request.
 */
import { clearSession, getAccessToken, loadSession, saveSession, setAccessToken } from './tokens';
import type { TokenPair } from './types';

const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Called when a refresh attempt fails — i.e. the session is truly over. The
 * AuthProvider registers a callback here so it can drop its user state and the
 * router can bounce to `/login`.
 */
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpired = callback;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the bearer token and enable refresh-on-401. Default `true`. */
  auth?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  return request<T>(path, options, false);
}

async function request<T>(path: string, options: RequestOptions, isRetry: boolean): Promise<T> {
  const { method = 'GET', body, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getAccessToken();
  if (auth && token !== null) headers.Authorization = `Bearer ${token}`;

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = JSON.stringify(body);

  const response = await fetch(`${API_URL}${path}`, init);

  if (response.status === 401 && auth && !isRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request<T>(path, options, true);
  }

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    // A non-JSON body (or none) — fall through to a generic message.
  }

  const fallback = `Request failed with status ${String(response.status)}`;

  // Only trust the standard `{ error: { code, message } }` envelope; a bare
  // `null`, `{}`, or a proxy's own shape falls back rather than throwing.
  if (
    typeof body === 'object' &&
    body !== null &&
    'error' in body &&
    typeof body.error === 'object' &&
    body.error !== null
  ) {
    const error = body.error as { code?: unknown; message?: unknown; details?: unknown };
    return new ApiError(
      response.status,
      typeof error.code === 'string' ? error.code : 'UNKNOWN',
      typeof error.message === 'string' ? error.message : fallback,
      error.details,
    );
  }

  return new ApiError(response.status, 'UNKNOWN', fallback);
}

// One shared refresh so concurrent 401s don't fire N parallel refreshes.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= runRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function runRefresh(): Promise<boolean> {
  const session = loadSession();
  if (session === null) return false;
  const startedWith = session.refreshToken;

  // Only touch the stored session if it's still the one we set out to refresh —
  // a concurrent login (or another refresh) may have replaced it while this
  // request was in flight, and we must not clobber the newer session.
  const stillOurs = () => loadSession()?.refreshToken === startedWith;

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: startedWith }),
    });

    if (!response.ok) {
      if (stillOurs()) endSession();
      return false;
    }

    const tokens = (await response.json()) as TokenPair;
    if (!stillOurs()) return true; // superseded — the newer session stands
    setAccessToken(tokens.accessToken);
    saveSession({ refreshToken: tokens.refreshToken, email: session.email });
    return true;
  } catch {
    if (stillOurs()) endSession();
    return false;
  }
}

function endSession(): void {
  clearSession();
  onSessionExpired?.();
}

/**
 * Used once at startup to turn a persisted refresh token back into a live
 * access token. Same machinery as the on-401 path.
 */
export async function restoreSession(): Promise<boolean> {
  return refreshAccessToken();
}
