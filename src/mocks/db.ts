/**
 * In-memory data for the mock backend. Mirrors just enough of job-hunt-api's
 * behaviour for the auth flow: unique emails, credential checks, and refresh
 * token rotation. Reset between tests by `resetDb()`.
 */

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
}

const SEED_USER: MockUser = {
  id: '3dea21eb-73b2-45bc-9c2c-92347672bb2b',
  email: 'ada@example.com',
  password: 'password123',
  createdAt: '2026-01-01T00:00:00.000Z',
};

function initialDb(): MockDb {
  return { users: [structuredClone(SEED_USER)], refreshTokens: [] };
}

export const db: MockDb = initialDb();

export function resetDb(): void {
  const fresh = initialDb();
  db.users = fresh.users;
  db.refreshTokens = fresh.refreshTokens;
}

export function findUserByEmail(email: string): MockUser | undefined {
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findRefreshToken(token: string): MockRefreshToken | undefined {
  return db.refreshTokens.find((t) => t.token === token);
}
