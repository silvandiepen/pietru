import { createApp } from 'vue'

// Styles are injected by ui() Vite plugin from vite.config.ts — no manual import needed.
import './styles/_tokens.scss'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'

createApp(App).use(router).use(i18n).mount('#app')
