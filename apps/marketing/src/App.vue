<template>
  <PillHeader
    brandTo="/"
    colorMode="light"
    :navItems="[
      { id: 'features', label: $t('app.navFeatures'), to: '/features' },
      { id: 'pricing', label: $t('app.navPricing'), to: '/pricing' },
      { id: 'docs', label: 'Docs', href: 'https://docs.pietru.dev', external: true }
    ]"
    :actions="headerActions"
  >
    <template #brand-mark>
      <span class="pietru-logo">
        <span class="pietru-logo__wordmark">
          <img src="@/assets/logo-wordmark.svg" alt="Pietru" />
        </span>
      </span>
    </template>
  </PillHeader>

  <main>
    <RouterView />
  </main>

  <footer class="site-footer">
    <div class="site-footer__glow" />
    <div class="site-footer__content">
      <div class="site-footer__brand">
        <span class="pietru-logo">
          <span class="pietru-logo__icon">
            <img src="@/assets/logo-icon-noborder.svg" alt="" aria-hidden="true" />
          </span>
          <span class="pietru-logo__wordmark">
            <img src="@/assets/logo-wordmark.svg" alt="Pietru" />
          </span>
        </span>
        <p class="site-footer__tagline">Email gateway for developers</p>
      </div>
      <nav class="site-footer__nav">
        <RouterLink to="/features">{{ $t('app.navFeatures') }}</RouterLink>
        <RouterLink to="/pricing">{{ $t('app.navPricing') }}</RouterLink>
        <a href="https://docs.pietru.dev" target="_blank" rel="noopener">Docs</a>
        <a href="https://github.com/silvandiepen/pietru" target="_blank" rel="noopener">{{ $t('app.github') }}</a>
      </nav>
      <div class="site-footer__divider" />
      <p class="site-footer__copy">&copy; {{ new Date().getFullYear() }} Hakobs. All rights reserved.</p>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { PillHeader } from '@sil/ui'
import { Colors } from '@sil/ui'

const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const headerActions = computed(() => [
  {
    id: 'login',
    label: 'Log in',
    variant: 'default' as const,
    handler: () => window.open(`${dashboardUrl}/login`, '_blank'),
  },
  {
    id: 'dashboard',
    label: 'Open Dashboard',
    variant: 'primary' as const,
    handler: () => window.open(dashboardUrl, '_blank'),
  },
])
</script>

<style lang="scss">
main {
  min-height: 100vh;
}

.site-footer {
  position: relative;
  background: var(--pietru-navy);
  padding: 3.5rem 2rem 2.5rem;
  margin-top: 0;
  overflow: hidden;

  &__glow {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    height: 160px;
    background: radial-gradient(ellipse, rgba(255, 59, 31, 0.08), transparent 70%);
    pointer-events: none;
  }

  &__content {
    max-width: 62rem;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
    text-align: center;
    position: relative;
    z-index: 1;
  }

  &__brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  &__tagline {
    margin: 0;
    color: color-mix(in srgb, var(--pietru-cream) 45%, transparent);
    font-size: 0.8rem;
    letter-spacing: 0.02em;
  }

  .pietru-logo__wordmark img {
    filter: brightness(0) invert(1);
  }

  &__nav {
    display: flex;
    gap: 1.75rem;
    flex-wrap: wrap;
    justify-content: center;

    a {
      color: color-mix(in srgb, var(--pietru-cream) 60%, transparent);
      font-size: 0.85rem;
      text-decoration: none;
      transition: color 160ms ease;

      &:hover {
        color: var(--pietru-cream);
      }
    }
  }

  &__divider {
    width: 48px;
    height: 1px;
    background: color-mix(in srgb, var(--pietru-cream) 12%, transparent);
  }

  &__copy {
    margin: 0;
    color: color-mix(in srgb, var(--pietru-cream) 35%, transparent);
    font-size: 0.75rem;
  }
}
</style>
