import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

// https://vite.dev/config/ · https://vitest.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    // `.env` is gitignored, so give tests a stable API base regardless of the
    // environment they run in (locally or CI). The MSW handlers target this.
    env: { VITE_API_URL: 'http://localhost:3001' },
  },
});
