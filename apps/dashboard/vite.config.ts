import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import { defineTheme, ui } from '@sil/ui/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PIETRU_API_URL || 'http://localhost:8787'

  return {
    plugins: [
      vue(),
      defineTheme({
        colors: {
          dark: '#020b22',
          light: '#ffffff',
          primary: '#55c267',
        },
        fonts: {
          body: 'Inter, system-ui, sans-serif',
        },
      }),
      ui(),
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
      plugins: [vue()],
      environment: 'jsdom',
      globals: true,
    },
  }
})
