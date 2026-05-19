<template>
  <PillHeader
    brandTo="/"
    colorMode="light"
    :navItems="[
      { id: 'features', label: $t('app.navFeatures'), to: '/features' },
      { id: 'pricing', label: $t('app.navPricing'), to: '/pricing' },
      { id: 'docs', label: $t('app.navDocs'), href: docsUrl, external: true }
    ]"
    :actions="headerActions"
    @themeToggle="toggleColorMode"
  >
    <template #brand-mark>
      <SiteLogo />
    </template>
  </PillHeader>

  <main>
    <RouterView />
  </main>

  <MailingListSection />
  <SiteFooter />
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { PillHeader } from '@sil/ui'
import { useI18n } from 'lezu-i18n/vue'
import MailingListSection from './components/MailingListSection.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteLogo from './components/SiteLogo.vue'
import { useColorMode } from './composables/useColorMode'

const { t } = useI18n()
const { toggleColorMode } = useColorMode()

const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'
const docsUrl = import.meta.env.VITE_PIETRU_DOCS_URL || 'https://docs.pietru.dev'

const headerActions = computed(() => [
  {
    id: 'dashboard',
    label: t('app.openDashboard'),
    variant: 'primary' as const,
    handler: () => window.open(dashboardUrl, '_blank'),
  },
])
</script>
