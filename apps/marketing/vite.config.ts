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
          dark: '#061F32',
          light: '#F4EFE3',
          primary: '#FF3B1F',
          secondary: '#083F61',
          success: '#2DBE7E',
          warning: '#FF8D22',
          error: '#F26D78',
          info: '#6BA9D6',
          border: '#E7DED0',
        },
        fonts: {
          body: 'Inter, system-ui, sans-serif',
          heading: 'Rubik, system-ui, sans-serif',
        },
        variables: {
          '--pietru-cream': '#F4EFE3',
          '--pietru-cream-card': '#F7F2E8',
          '--pietru-navy': '#061F32',
          '--pietru-navy-deep': '#021B2C',
          '--pietru-navy-text': '#102B3C',
          '--pietru-muted': '#5D6B72',
          '--pietru-red': '#FF3B1F',
          '--pietru-red-muted': '#D94B36',
          '--pietru-border': '#E7DED0',
          '--pietru-radius': '4px',
          '--pietru-radius-md': '8px',
          '--pietru-radius-lg': '12px',
        },
      }),
    }),
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
