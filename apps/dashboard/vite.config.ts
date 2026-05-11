import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const envDir = fileURLToPath(new URL('.', import.meta.url))
  const env = loadEnv(mode, envDir, '')
  const apiTarget = env.VITE_PIETRU_API_URL || 'http://localhost:8787'

  return {
    plugins: [
      vue(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      include: ['apps/dashboard/src/**/*.test.ts'],
      setupFiles: ['apps/dashboard/src/test-setup.ts'],
      environment: 'jsdom',
      globals: true,
    },
  }
})
