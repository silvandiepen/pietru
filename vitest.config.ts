import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@pietru/auth': resolve(__dirname, 'packages/auth/dist/index.js'),
      '@pietru/core': resolve(__dirname, 'packages/core/dist/index.js'),
      '@pietru/db': resolve(__dirname, 'packages/db/dist/index.js'),
      '@pietru/providers': resolve(__dirname, 'packages/providers/dist/index.js'),
      '@pietru/validation': resolve(__dirname, 'packages/validation/dist/index.js'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/marketing/**', 'apps/dashboard/**'],
  },
});
