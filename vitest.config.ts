import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@pietru/auth': `${root}/packages/auth/src/index.ts`,
      '@pietru/core': `${root}/packages/core/src/index.ts`,
      '@pietru/db': `${root}/packages/db/src/index.ts`,
      '@pietru/providers': `${root}/packages/providers/src/index.ts`,
      '@pietru/validation': `${root}/packages/validation/src/index.ts`,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'apps/marketing/**', 'apps/dashboard/**'],
  },
});
