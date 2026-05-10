import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@pietru/auth': `${root}/packages/auth/dist/index.js`,
      '@pietru/core': `${root}/packages/core/dist/index.js`,
      '@pietru/db': `${root}/packages/db/dist/index.js`,
      '@pietru/providers': `${root}/packages/providers/dist/index.js`,
      '@pietru/validation': `${root}/packages/validation/dist/index.js`,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/marketing/**', 'apps/dashboard/**'],
  },
});
