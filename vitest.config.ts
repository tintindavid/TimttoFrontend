import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setupTests.ts'],
    // Vitest sólo debe correr specs unitarios dentro de src/.
    // Los archivos bajo tests/e2e/ pertenecen a Playwright y se ejecutan con `npm run test:e2e`.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
