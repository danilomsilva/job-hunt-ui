import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';
import { resetDb } from '../mocks/db';

// One mock backend for the whole suite. `onUnhandledRequest: 'error'` makes a
// request to an endpoint we forgot to mock fail loudly instead of hitting the
// network.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
