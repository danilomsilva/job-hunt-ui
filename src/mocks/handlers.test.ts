import { describe, expect, it } from 'vitest';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function post(path: string, body: unknown) {
  return fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('mock auth API', () => {
  it('registers a new account and returns the user without tokens', async () => {
    const res = await post('/auth/register', {
      email: 'grace@example.com',
      password: 'hopper1906',
    });
    expect(res.status).toBe(201);
    const user = (await res.json()) as Record<string, unknown>;
    expect(user).toMatchObject({ email: 'grace@example.com' });
    expect(user).not.toHaveProperty('accessToken');
  });

  it('rejects a duplicate email with 409 CONFLICT', async () => {
    const res = await post('/auth/register', { email: 'ada@example.com', password: 'password123' });
    expect(res.status).toBe(409);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('CONFLICT');
  });

  it('rejects a malformed body with 400 VALIDATION_ERROR', async () => {
    const res = await post('/auth/register', { email: 'not-an-email', password: 'x' });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in a seeded user and returns a token pair', async () => {
    const res = await post('/auth/login', { email: 'ada@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toHaveProperty('accessToken');
    expect(body).toHaveProperty('refreshToken');
  });

  it('gives one opaque 401 for a wrong password', async () => {
    const res = await post('/auth/login', { email: 'ada@example.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { message: string } };
    expect(body.error.message).toBe('Invalid email or password');
  });

  it('rotates the refresh token, invalidating the old one', async () => {
    const login = await post('/auth/login', { email: 'ada@example.com', password: 'password123' });
    const { refreshToken } = (await login.json()) as { refreshToken: string };

    const first = await post('/auth/refresh', { refreshToken });
    expect(first.status).toBe(200);

    const reuse = await post('/auth/refresh', { refreshToken });
    expect(reuse.status).toBe(401);
  });

  it('always returns 204 from logout', async () => {
    const res = await post('/auth/logout', { refreshToken: 'whatever' });
    expect(res.status).toBe(204);
  });
});
