<template>
  <PillHeader
    brandTo="/"
    :brandSuffix="$t('app.brand')"
    colorMode="dark"
    :navItems="[
      { id: 'features', label: $t('app.navFeatures'), to: '/features' },
      { id: 'pricing', label: $t('app.navPricing'), to: '/pricing' },
      { id: 'about', label: $t('app.navAbout'), to: '/about' }
    ]"
    :actions="[{ label: $t('app.openDashboard'), variant: 'primary', handler: openDashboard }]"
  />

  <main>
    <RouterView />
  </main>

  <PlatformFooter colorMode="dark">
    <template #brand>
      {{ $t('app.brand') }}
    </template>
    <template #nav>
      <RouterLink to="/features">{{ $t('app.navFeatures') }}</RouterLink>
      <RouterLink to="/pricing">{{ $t('app.navPricing') }}</RouterLink>
      <RouterLink to="/about">{{ $t('app.navAbout') }}</RouterLink>
      <a href="https://github.com/silvandiepen/pietru" target="_blank" rel="noopener">{{ $t('app.github') }}</a>
    </template>
  </PlatformFooter>
</template>

<script lang="ts" setup>
import { PillHeader, PlatformFooter } from '@sil/ui'

const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

function openDashboard() {
  window.open(dashboardUrl, '_blank')
}
</script>

<style lang="scss" scoped>
main {
  min-height: 100vh;
  background: #020b22;
  padding-top: 5rem;
}
</style>
