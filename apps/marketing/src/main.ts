import { createApp } from 'vue'

// @sil/ui styles + Pietru color config (SCSS variable overrides baked into generated :root)
import './styles/_tokens.scss'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'

createApp(App).use(router).use(i18n).mount('#app')
