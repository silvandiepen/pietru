<template>
  <PillHeader
    brandTo="/"
    brandSuffix="Pietru"
    colorMode="dark"
    :navItems="[{ id: 'features', label: 'Features', to: '/features' }]"
    :actions="[{ label: 'Open Dashboard', variant: 'primary', handler: openDashboard }]"
  />

  <main>
    <RouterView />
  </main>

  <PlatformFooter colorMode="dark">
    <template #brand>
      Pietru
    </template>
    <template #nav>
      <RouterLink to="/features">Features</RouterLink>
      <a href="https://github.com/silvandiepen/pietru" target="_blank" rel="noopener">GitHub</a>
    </template>
  </PlatformFooter>
</template>

<script lang="ts" setup>
import { PillHeader, PlatformFooter } from '@sil/ui'

const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app-pietru.hakobs.com'

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
