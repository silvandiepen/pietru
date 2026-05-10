import type { LezuI18n } from 'lezu-i18n'

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: LezuI18n['$t']
    $md: LezuI18n['$md']
  }
}
