import { createApp } from 'vue'

// @sil/ui base styles + theme overrides — resolved by ui() Vite plugin
import 'virtual:sil-ui/theme'
import './styles/_tokens.scss'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'

createApp(App).use(router).use(i18n).mount('#app')
