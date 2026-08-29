/**
 * MSW handlers that stand in for job-hunt-api during tests. Behaviour is kept
 * faithful to its `src/routes/auth.ts`: unique-email conflict on register,
 * one opaque "invalid email or password" on login, refresh-token rotation, and
 * the shared `{ error: { code, message, details? }, requestId }` error body.
 */
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { credentialsSchema } from '../auth/schemas';
import { db, findRefreshToken, findUserByEmail, type MockUser } from './db';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const refreshBodySchema = z.object({ refreshToken: z.string().min(1) });

function requestId(): string {
  return crypto.randomUUID();
}

function errorBody(code: string, message: string, details?: unknown) {
  return {
    error: details === undefined ? { code, message } : { code, message, details },
    requestId: requestId(),
  };
}

function validationError(error: z.ZodError) {
  return HttpResponse.json(
    errorBody('VALIDATION_ERROR', 'The request payload failed validation', z.treeifyError(error)),
    { status: 400 },
  );
}

function makeAccessToken(userId: string): string {
  const payload = { sub: userId, iat: Date.now(), exp: Date.now() + 15 * 60 * 1000 };
  return `mock.${btoa(JSON.stringify(payload))}.sig`;
}

function issueTokenPair(user: MockUser) {
  const accessToken = makeAccessToken(user.id);
  const refreshToken =
    crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  db.refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    expiresAt: Date.now() + REFRESH_TTL_MS,
  });
  return { accessToken, refreshToken };
}

export const handlers = [
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    const parsed = credentialsSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const { email, password } = parsed.data;
    if (findUserByEmail(email)) {
      return HttpResponse.json(errorBody('CONFLICT', 'An account with this email already exists'), {
        status: 409,
      });
    }

    const user: MockUser = {
      id: crypto.randomUUID(),
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return HttpResponse.json(
      { id: user.id, email: user.email, createdAt: user.createdAt },
      { status: 201 },
    );
  }),

  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const parsed = credentialsSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const { email, password } = parsed.data;
    const user = findUserByEmail(email);
    if (user?.password !== password) {
      return HttpResponse.json(errorBody('UNAUTHORIZED', 'Invalid email or password'), {
        status: 401,
      });
    }

    return HttpResponse.json(issueTokenPair(user), { status: 200 });
  }),

  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    const parsed = refreshBodySchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const existing = findRefreshToken(parsed.data.refreshToken);
    if (!existing || existing.expiresAt < Date.now()) {
      return HttpResponse.json(errorBody('UNAUTHORIZED', 'Invalid or expired refresh token'), {
        status: 401,
      });
    }

    // Rotation: the presented token is spent, whatever happens next.
    db.refreshTokens = db.refreshTokens.filter((t) => t.token !== existing.token);
    const user = db.users.find((u) => u.id === existing.userId);
    if (!user) {
      return HttpResponse.json(errorBody('UNAUTHORIZED', 'Invalid or expired refresh token'), {
        status: 401,
      });
    }
    return HttpResponse.json(issueTokenPair(user), { status: 200 });
  }),

  http.post(`${API_URL}/auth/logout`, async ({ request }) => {
    // Delete the token if we recognise it; the real API returns 204 either way
    // and never reveals whether it existed.
    const parsed = refreshBodySchema.safeParse(await request.json().catch(() => null));
    if (parsed.success) {
      db.refreshTokens = db.refreshTokens.filter((t) => t.token !== parsed.data.refreshToken);
    }
    return new HttpResponse(null, { status: 204 });
  }),
];
