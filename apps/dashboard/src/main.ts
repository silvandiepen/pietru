import { createPinia } from 'pinia'
import { createApp } from 'vue'

import '@sil/ui/style.css'

import App from './App.vue'
import router from './router'
import './styles/_tokens.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.mount('#app')
