/**
 * MSW handlers that stand in for job-hunt-api during tests. Behaviour is kept
 * faithful to its `src/routes/auth.ts` and `src/routes/applications.ts`:
 * unique-email conflict on register, one opaque "invalid email or password" on
 * login, refresh-token rotation, bearer-guarded applications CRUD (a shared
 * "Application not found" for a missing / not-owned / malformed id), and the
 * shared `{ error: { code, message, details? }, requestId }` error body.
 */
import { http, HttpResponse } from 'msw';
import { z } from 'zod';
import { credentialsSchema } from '../auth/schemas';
import type { Application, ApplicationSort } from '../lib/types';
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

function unauthorized() {
  return HttpResponse.json(errorBody('UNAUTHORIZED', 'Invalid or expired access token'), {
    status: 401,
  });
}

function applicationNotFound() {
  return HttpResponse.json(errorBody('NOT_FOUND', 'Application not found'), { status: 404 });
}

function makeAccessToken(userId: string): string {
  const payload = { sub: userId, iat: Date.now(), exp: Date.now() + 15 * 60 * 1000 };
  return `mock.${btoa(JSON.stringify(payload))}.sig`;
}

const accessPayloadSchema = z.object({ sub: z.string() });

/**
 * The `Bearer` token's user, or `undefined` if the header is missing, malformed,
 * or names a user we don't know. Enough of a guard to exercise the client's
 * 401 → refresh → retry path against a real endpoint.
 */
function userIdFromAuthHeader(request: Request): string | undefined {
  const header = request.headers.get('Authorization');
  if (header?.startsWith('Bearer ') !== true) return undefined;

  const payload = header.slice('Bearer '.length).split('.')[1];
  if (payload === undefined) return undefined;

  try {
    const parsed = accessPayloadSchema.safeParse(JSON.parse(atob(payload)));
    if (!parsed.success) return undefined;
    return db.users.some((u) => u.id === parsed.data.sub) ? parsed.data.sub : undefined;
  } catch {
    return undefined;
  }
}

function isSort(value: string | null): value is ApplicationSort {
  return (
    value === 'createdAt' || value === 'updatedAt' || value === 'appliedAt' || value === 'company'
  );
}

interface ListQuery {
  status: string | null;
  company: string | null;
  sortBy: ApplicationSort;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

/** Parse `GET /applications` query params the way job-hunt-api's `listQuerySchema` does. */
function parseListQuery(url: string): ListQuery {
  const params = new URL(url).searchParams;
  const sortByRaw = params.get('sortBy');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get('pageSize')) || 20));
  return {
    status: params.get('status'),
    company: params.get('company'),
    sortBy: isSort(sortByRaw) ? sortByRaw : 'createdAt',
    sortOrder: params.get('sortOrder') === 'asc' ? 'asc' : 'desc',
    page,
    pageSize,
  };
}

function compareBy(a: Application, b: Application, sortBy: ApplicationSort): number {
  if (sortBy === 'company') return a.company.localeCompare(b.company);
  const left = a[sortBy];
  const right = b[sortBy];
  if (left === right) return 0;
  if (left === null) return 1; // nulls last
  if (right === null) return -1;
  return left < right ? -1 : 1;
}

function findOwnedApplication(id: string, userId: string): Application | undefined {
  return db.applications.find((a) => a.id === id && a.userId === userId);
}

// Mirrors job-hunt-api's `applicationFields` + the `salaryMin <= salaryMax`
// refinement. The client always sends every field, so keys are required here
// (`.nullable()`, not `.nullish()`); PATCH takes the `.partial()` form.
const applicationFieldsSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  status: z.enum([
    'wishlist',
    'applied',
    'phone_screen',
    'interview',
    'offer',
    'rejected',
    'accepted',
  ]),
  location: z.string().min(1).nullable(),
  jobUrl: z.url().nullable(),
  salaryMin: z.number().int().nonnegative().nullable(),
  salaryMax: z.number().int().nonnegative().nullable(),
  salaryCurrency: z.string().length(3).nullable(),
  notes: z.string().nullable(),
  appliedAt: z.string().nullable(),
});

const salaryRangeOk = (v: {
  salaryMin?: number | null | undefined;
  salaryMax?: number | null | undefined;
}): boolean => v.salaryMin == null || v.salaryMax == null || v.salaryMin <= v.salaryMax;
const salaryRangeIssue = {
  message: 'salaryMin must not be greater than salaryMax',
  path: ['salaryMin'],
};

const createPayloadSchema = applicationFieldsSchema.refine(salaryRangeOk, salaryRangeIssue);
const updatePayloadSchema = applicationFieldsSchema
  .partial()
  .refine(salaryRangeOk, salaryRangeIssue);

function isoOrNull(value: string | null | undefined): string | null | undefined {
  if (typeof value !== 'string') return value;
  return new Date(value).toISOString();
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

  http.get(`${API_URL}/applications`, ({ request }) => {
    const userId = userIdFromAuthHeader(request);
    if (userId === undefined) return unauthorized();

    const query = parseListQuery(request.url);
    let rows = db.applications.filter((application) => application.userId === userId);
    if (query.status !== null) {
      rows = rows.filter((application) => application.status === query.status);
    }
    if (query.company !== null) {
      const needle = query.company.toLowerCase();
      rows = rows.filter((application) => application.company.toLowerCase().includes(needle));
    }
    rows = [...rows].sort((a, b) => {
      const result = compareBy(a, b, query.sortBy);
      return query.sortOrder === 'asc' ? result : -result;
    });

    const total = rows.length;
    const start = (query.page - 1) * query.pageSize;
    const data = rows.slice(start, start + query.pageSize);

    return HttpResponse.json({
      data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize) || 1,
      },
    });
  }),

  http.post(`${API_URL}/applications`, async ({ request }) => {
    const userId = userIdFromAuthHeader(request);
    if (userId === undefined) return unauthorized();

    const parsed = createPayloadSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const now = new Date().toISOString();
    const application: Application = {
      ...parsed.data,
      id: crypto.randomUUID(),
      userId,
      appliedAt: isoOrNull(parsed.data.appliedAt) ?? null,
      createdAt: now,
      updatedAt: now,
    };
    db.applications.push(application);
    return HttpResponse.json(application, { status: 201 });
  }),

  http.get(`${API_URL}/applications/:id`, ({ request, params }) => {
    const userId = userIdFromAuthHeader(request);
    if (userId === undefined) return unauthorized();

    const application = findOwnedApplication(String(params.id), userId);
    return application ? HttpResponse.json(application) : applicationNotFound();
  }),

  http.patch(`${API_URL}/applications/:id`, async ({ request, params }) => {
    const userId = userIdFromAuthHeader(request);
    if (userId === undefined) return unauthorized();

    const existing = findOwnedApplication(String(params.id), userId);
    if (!existing) return applicationNotFound();

    const parsed = updatePayloadSchema.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error);

    const patch = { ...parsed.data };
    if (patch.appliedAt !== undefined) patch.appliedAt = isoOrNull(patch.appliedAt) ?? null;
    Object.assign(existing, patch, { updatedAt: new Date().toISOString() });
    return HttpResponse.json(existing);
  }),

  http.delete(`${API_URL}/applications/:id`, ({ request, params }) => {
    const userId = userIdFromAuthHeader(request);
    if (userId === undefined) return unauthorized();

    const existing = findOwnedApplication(String(params.id), userId);
    if (!existing) return applicationNotFound();

    db.applications = db.applications.filter((a) => a.id !== existing.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
