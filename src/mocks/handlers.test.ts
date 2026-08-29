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

describe('mock applications API', () => {
  async function loginAsSeedUser(): Promise<string> {
    const res = await post('/auth/login', { email: 'ada@example.com', password: 'password123' });
    const { accessToken } = (await res.json()) as { accessToken: string };
    return accessToken;
  }

  it('rejects a request with no bearer token', async () => {
    const res = await fetch(`${API_URL}/applications`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  interface ListBody {
    data: { company: string; status: string }[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  }

  async function list(query: string): Promise<ListBody> {
    const accessToken = await loginAsSeedUser();
    const res = await fetch(`${API_URL}/applications${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    expect(res.status).toBe(200);
    return (await res.json()) as ListBody;
  }

  it('returns the seeded applications for a valid token', async () => {
    const body = await list('');
    expect(body.data).toHaveLength(4);
    expect(body.data.map((a) => a.company)).toContain('Globex');
    expect(body.pagination).toMatchObject({ total: 4, totalPages: 1 });
  });

  it('filters by status', async () => {
    const body = await list('?status=interview');
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({ company: 'Globex', status: 'interview' });
  });

  it('filters by company as a case-insensitive substring', async () => {
    const body = await list('?company=obex');
    expect(body.data.map((a) => a.company)).toEqual(['Globex']);
  });

  it('sorts by company ascending', async () => {
    const body = await list('?sortBy=company&sortOrder=asc');
    expect(body.data.map((a) => a.company)).toEqual(['Globex', 'Hooli', 'Initech', 'Umbrella']);
  });

  it('paginates', async () => {
    const body = await list('?pageSize=2&page=2&sortBy=company&sortOrder=asc');
    expect(body.data.map((a) => a.company)).toEqual(['Initech', 'Umbrella']);
    expect(body.pagination).toMatchObject({ page: 2, pageSize: 2, total: 4, totalPages: 2 });
  });

  const validPayload = {
    company: 'Wayne Enterprises',
    role: 'Security Engineer',
    status: 'applied' as const,
    location: 'Gotham',
    jobUrl: 'https://wayne.example/jobs/1',
    salaryMin: 100000,
    salaryMax: 150000,
    salaryCurrency: 'USD',
    notes: 'Applied via referral',
    appliedAt: '2026-08-15',
  };

  async function authed(method: string, path: string, body?: unknown): Promise<Response> {
    const accessToken = await loginAsSeedUser();
    const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    return fetch(`${API_URL}${path}`, init);
  }

  async function createOne(): Promise<{ id: string; updatedAt: string }> {
    const res = await authed('POST', '/applications', validPayload);
    expect(res.status).toBe(201);
    return (await res.json()) as { id: string; updatedAt: string };
  }

  it('creates an application, normalises appliedAt, and lists it', async () => {
    const res = await authed('POST', '/applications', validPayload);
    expect(res.status).toBe(201);
    const created = (await res.json()) as { company: string; appliedAt: string };
    expect(created.company).toBe('Wayne Enterprises');
    expect(created.appliedAt).toBe('2026-08-15T00:00:00.000Z');

    const listed = await list('');
    expect(listed.data.map((a) => a.company)).toContain('Wayne Enterprises');
  });

  it('rejects a create with salaryMin greater than salaryMax', async () => {
    const res = await authed('POST', '/applications', {
      ...validPayload,
      salaryMin: 200000,
      salaryMax: 100000,
    });
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: { code: string } }).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('fetches one application by id', async () => {
    const { id } = await createOne();
    const res = await authed('GET', `/applications/${id}`);
    expect(res.status).toBe(200);
    expect((await res.json()) as { id: string }).toMatchObject({ id });
  });

  it('404s get / patch / delete for an unknown id', async () => {
    const unknown = '00000000-0000-0000-0000-000000000000';
    expect((await authed('GET', `/applications/${unknown}`)).status).toBe(404);
    expect((await authed('PATCH', `/applications/${unknown}`, validPayload)).status).toBe(404);
    expect((await authed('DELETE', `/applications/${unknown}`)).status).toBe(404);
  });

  it('patches a field, leaving the rest intact', async () => {
    const { id } = await createOne();
    const res = await authed('PATCH', `/applications/${id}`, { ...validPayload, status: 'offer' });
    expect(res.status).toBe(200);
    expect((await res.json()) as { status: string; company: string }).toMatchObject({
      status: 'offer',
      company: 'Wayne Enterprises',
    });
  });

  it('deletes an application', async () => {
    const { id } = await createOne();
    expect((await authed('DELETE', `/applications/${id}`)).status).toBe(204);
    expect((await authed('GET', `/applications/${id}`)).status).toBe(404);
  });
});
