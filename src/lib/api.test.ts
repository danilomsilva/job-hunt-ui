import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '../mocks/server';
import { ApiError, apiFetch, setOnSessionExpired } from './api';
import { getAccessToken, loadSession, saveSession, setAccessToken } from './tokens';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function seedSession() {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ada@example.com', password: 'password123' }),
  });
  const { accessToken, refreshToken } = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setAccessToken(accessToken);
  saveSession({ refreshToken, email: 'ada@example.com' });
}

beforeEach(() => {
  setOnSessionExpired(null);
});

describe('apiFetch', () => {
  it('parses an error body into an ApiError', async () => {
    await expect(
      apiFetch('/auth/login', {
        method: 'POST',
        body: { email: 'ada@example.com', password: 'wrongpassword' },
        auth: false,
      }),
    ).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      code: 'UNAUTHORIZED',
      message: 'Invalid email or password',
    });
  });

  it('still yields an ApiError when the error body is not the standard envelope', async () => {
    server.use(
      http.get(`${API_URL}/thing`, () => HttpResponse.json(null, { status: 502 })),
      http.get(`${API_URL}/thing2`, () => HttpResponse.json({}, { status: 500 })),
    );

    await expect(apiFetch('/thing', { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      code: 'UNKNOWN',
    });
    await expect(apiFetch('/thing2', { auth: false })).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      code: 'UNKNOWN',
    });
  });

  it('refreshes the access token on a 401 and retries the request once', async () => {
    await seedSession();
    setAccessToken('stale-token');

    let calls = 0;
    server.use(
      http.get(`${API_URL}/protected`, () => {
        calls += 1;
        if (calls === 1) return new HttpResponse(null, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
    );

    const result = await apiFetch<{ ok: boolean }>('/protected');

    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
    expect(getAccessToken()).not.toBe('stale-token');
    expect(getAccessToken()).not.toBeNull();
  });

  it('gives up, clears the session, and notifies when refresh fails', async () => {
    saveSession({ refreshToken: 'no-longer-valid', email: 'ada@example.com' });
    setAccessToken('stale-token');
    const expired = vi.fn();
    setOnSessionExpired(expired);

    server.use(http.get(`${API_URL}/protected`, () => new HttpResponse(null, { status: 401 })));

    await expect(apiFetch('/protected')).rejects.toBeInstanceOf(ApiError);
    expect(expired).toHaveBeenCalledOnce();
    expect(loadSession()).toBeNull();
    expect(getAccessToken()).toBeNull();
  });
});
