import { createPinia } from 'pinia'
import { createApp } from 'vue'

// Styles are injected by ui() Vite plugin from vite.config.ts — no manual import needed.

import App from './App.vue'
import i18n from './i18n'
import router from './router'
import './styles/_tokens.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.mount('#app')
