import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** The mock job-hunt-api used by the test suite (wired up in `src/test/setup.ts`). */
export const server = setupServer(...handlers);
