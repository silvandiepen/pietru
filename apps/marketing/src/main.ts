import { createApp } from 'vue'

// @sil/ui styles with Pietru's color config baked in via SCSS variables
// _tokens.scss does: @use '@sil/ui/defaults' with ($project-colors: (...)); @use '@sil/ui/styles';
import './styles/_tokens.scss'

import App from './App.vue'
import router from './router'
import i18n from '@/i18n'

createApp(App).use(router).use(i18n).mount('#app')
