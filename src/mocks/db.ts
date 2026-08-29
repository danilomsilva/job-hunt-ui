/**
 * In-memory data for the mock backend. Mirrors just enough of job-hunt-api's
 * behaviour for the auth flow (unique emails, credential checks, refresh token
 * rotation) and a read-only applications list. Reset between tests by `resetDb()`.
 */
import type { Application } from '../lib/types';

export interface MockUser {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface MockRefreshToken {
  token: string;
  userId: string;
  expiresAt: number;
}

interface MockDb {
  users: MockUser[];
  refreshTokens: MockRefreshToken[];
  applications: Application[];
}

const SEED_USER: MockUser = {
  id: '3dea21eb-73b2-45bc-9c2c-92347672bb2b',
  email: 'ada@example.com',
  password: 'password123',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function seedApplication(overrides: Partial<Application>): Application {
  return {
    id: crypto.randomUUID(),
    userId: SEED_USER.id,
    company: 'Acme Corp',
    role: 'Backend Engineer',
    status: 'applied',
    location: 'Remote',
    jobUrl: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    notes: null,
    appliedAt: '2026-08-01T00:00:00.000Z',
    createdAt: '2026-08-01T09:00:00.000Z',
    updatedAt: '2026-08-01T09:00:00.000Z',
    ...overrides,
  };
}

function initialDb(): MockDb {
  return {
    users: [structuredClone(SEED_USER)],
    refreshTokens: [],
    applications: [
      seedApplication({ company: 'Globex', role: 'Staff Engineer', status: 'interview' }),
      seedApplication({ company: 'Initech', role: 'Platform Engineer', status: 'phone_screen' }),
      seedApplication({ company: 'Umbrella', role: 'SRE', status: 'wishlist', appliedAt: null }),
      seedApplication({ company: 'Hooli', role: 'Backend Engineer', status: 'rejected' }),
    ],
  };
}

export const db: MockDb = initialDb();

export function resetDb(): void {
  const fresh = initialDb();
  db.users = fresh.users;
  db.refreshTokens = fresh.refreshTokens;
  db.applications = fresh.applications;
}

export function findUserByEmail(email: string): MockUser | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findRefreshToken(token: string): MockRefreshToken | undefined {
  return db.refreshTokens.find((t) => t.token === token);
}
