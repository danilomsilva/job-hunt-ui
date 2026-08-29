import '@testing-library/jest-dom/vitest';
import type { AxeResults } from 'axe-core';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from '../mocks/server';
import { resetDb } from '../mocks/db';

// A tiny matcher over axe-core's results (vitest-axe doesn't play well with
// vitest 4's matcher types).
expect.extend({
  toHaveNoViolations(results: AxeResults) {
    const { violations } = results;
    const pass = violations.length === 0;
    return {
      pass,
      message: () =>
        pass
          ? 'expected accessibility violations, found none'
          : `expected no accessibility violations, found ${String(violations.length)}:\n` +
            violations
              .map(
                (v) => `  • ${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`,
              )
              .join('\n'),
    };
  },
});

declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
}

// jsdom's bare document has no lang; production's index.html sets en-IE.
document.documentElement.lang = 'en-IE';

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
