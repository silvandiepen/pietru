import { createI18n } from 'lezu-i18n'
import { createLezuI18nVue } from 'lezu-i18n/vue'
import en from './locales/en.json'

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en },
})

const vuePlugin = createLezuI18nVue(i18n)

export default vuePlugin
