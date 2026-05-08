import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { defineTheme, ui } from '@sil/ui/vite'

export default defineConfig({
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
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
