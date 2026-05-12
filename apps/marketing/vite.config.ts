import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { ui } from '@sil/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['highlight.js/lib/core'],
  },
  test: {
    include: ['apps/marketing/src/**/*.test.ts'],
    plugins: [vue()],
    environment: 'jsdom',
    globals: true,
  },
})
