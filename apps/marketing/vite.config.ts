import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineTheme, ui } from '@sil/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      theme: defineTheme({
        colors: {
          dark: '#021823',
          light: '#f9f8ea',
          primary: '#ef4728',
          secondary: "#083f61"
        },
        fonts: {
          body: 'Inter, system-ui, sans-serif',
        },
      }),
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    include: ['apps/marketing/src/**/*.test.ts'],
    plugins: [vue()],
    environment: 'jsdom',
    globals: true,
  },
})
