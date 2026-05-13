<script setup lang="ts">
import { useBemm } from 'bemm'
import { RouterLink } from 'vue-router'
import SiteLogo from './SiteLogo.vue'

const bemm = useBemm('site-footer', { return: 'string' })

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer :class="bemm()">
    <div :class="bemm('glow')" />
    <div :class="bemm('content')">
      <div :class="bemm('brand')">
        <SiteLogo />
        <p :class="bemm('tagline')">{{ $t('app.tagline') }}</p>
      </div>
      <nav :class="bemm('nav')">
        <RouterLink to="/features">{{ $t('app.navFeatures') }}</RouterLink>
        <RouterLink to="/pricing">{{ $t('app.navPricing') }}</RouterLink>
        <a href="https://docs.pietru.dev" target="_blank" rel="noopener">{{ $t('app.navDocs') }}</a>
        <a href="https://github.com/silvandiepen/pietru" target="_blank" rel="noopener">{{ $t('app.github') }}</a>
      </nav>
      <div :class="bemm('divider')" />
      <p :class="bemm('copy')">
        &copy; {{ currentYear }} Hakobs. {{ $t('app.allRightsReserved') }}
      </p>
    </div>
  </footer>
</template>

<style lang="scss">
.site-footer {
  position: relative;
  background: color-mix(in srgb, var(--color-dark), black 50%);
  color: var(--color-light);
  padding: var(--spacing);
  margin-top: 0;
  overflow: hidden;

  &__glow {
    display: none;
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
    color: color-mix(in srgb, white 45%, transparent);
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
      color: color-mix(in srgb, white 60%, transparent);
      font-size: 0.85rem;
      text-decoration: none;
      transition: color 160ms ease;

      &:hover {
        color: white;
      }
    }
  }

  &__divider {
    width: 48px;
    height: 1px;
    background: color-mix(in srgb, white 12%, transparent);
  }

  &__copy {
    margin: 0;
    color: color-mix(in srgb, white 35%, transparent);
    font-size: 0.75rem;
  }
}
</style>
