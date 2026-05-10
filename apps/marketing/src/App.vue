<template>
  <PillHeader
    brandTo="/"
    :brandSuffix="$t('app.brand')"
    :colorMode="colorMode"
    :navItems="[
      { id: 'features', label: $t('app.navFeatures'), to: '/features' },
      { id: 'pricing', label: $t('app.navPricing'), to: '/pricing' },
      { id: 'about', label: $t('app.navAbout'), to: '/about' }
    ]"
    :actions="headerActions"
  />

  <main>
    <RouterView />
  </main>

  <PlatformFooter :colorMode="colorMode === 'dark' ? 'dark' : 'light'">
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
import { computed } from 'vue'
import { PillHeader, PlatformFooter, Icons } from '@sil/ui'
import { useColorMode } from '@/composables/useColorMode'

const { colorMode, toggleColorMode } = useColorMode()

const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const headerActions = computed(() => [
  {
    id: 'theme',
    label: colorMode.value === 'dark' ? 'Light mode' : 'Dark mode',
    icon: colorMode.value === 'dark' ? Icons.WEATHER_SUN : Icons.WEATHER_MOON,
    iconOnly: true,
    handler: toggleColorMode,
  },
  {
    id: 'dashboard',
    label: 'Open Dashboard',
    variant: 'primary' as const,
    handler: () => window.open(dashboardUrl, '_blank'),
  },
])
</script>

<style lang="scss" scoped>
main {
  min-height: 100vh;
  padding-top: 5rem;
}
</style>
