import { config } from '@vue/test-utils'
import { createI18n, fromObject } from 'lezu-i18n'
import { createLezuI18nVue } from 'lezu-i18n/vue'
import en from './i18n/locales/en.json'

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  loaders: { messages: fromObject({ en }) },
})

config.global.plugins = [createLezuI18nVue(i18n)]
