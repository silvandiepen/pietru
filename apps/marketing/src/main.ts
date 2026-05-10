import { createApp } from 'vue'

import '@sil/ui/style.css'
import './styles/_tokens.scss'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'

createApp(App).use(router).use(i18n).mount('#app')
