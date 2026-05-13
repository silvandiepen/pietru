<script setup lang="ts">
import { useBemm } from 'bemm'
import { RouterLink } from 'vue-router'
import { Icon } from '@sil/ui'
import { useI18n } from 'lezu-i18n/vue'
import SiteLogo from './SiteLogo.vue'
import { useColorMode } from '../composables/useColorMode'

const bemm = useBemm('site-footer', { return: 'string' })

const currentYear = new Date().getFullYear()
const { i18n, t } = useI18n()
const { colorMode, toggleColorMode } = useColorMode()

const locales = [
  { code: 'en', label: 'English' },
  { code: 'nl', label: 'Nederlands' },
]

function switchLocale(code: string) {
  i18n.setLocale(code)
}
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
      <div :class="bemm('bottom')">
        <p :class="bemm('copy')">
          &copy; {{ currentYear }} Hakobs. {{ $t('app.allRightsReserved') }}
        </p>
        <div :class="bemm('switches')">
          <button
            :class="[bemm('switch'), bemm('color-switch')]"
            :aria-label="colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleColorMode"
          >
            <Icon :name="colorMode === 'dark' ? 'weather/sun' : 'weather/moon'" />
          </button>
          <div :class="bemm('locale-switch')">
            <button
              v-for="loc in locales"
              :key="loc.code"
              :class="[bemm('switch'), i18n.getLocale() === loc.code ? bemm('switch--active') : '']"
              :aria-label="`Switch language to ${loc.label}`"
              @click="switchLocale(loc.code)"
            >
              {{ loc.code.toUpperCase() }}
            </button>
          </div>
        </div>
      </div>
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

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  &__copy {
    margin: 0;
    color: color-mix(in srgb, white 35%, transparent);
    font-size: 0.75rem;
  }

  &__switches {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__switch {
    background: color-mix(in srgb, white 8%, transparent);
    border: 1px solid color-mix(in srgb, white 10%, transparent);
    border-radius: var(--border-radius-xs);
    color: color-mix(in srgb, white 55%, transparent);
    cursor: pointer;
    padding: 0.3em 0.5em;
    font-size: 0.7rem;
    line-height: 1;
    transition: all 160ms ease;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      background: color-mix(in srgb, white 14%, transparent);
      color: white;
    }

    &--active {
      background: color-mix(in srgb, white 18%, transparent);
      color: white;
      border-color: color-mix(in srgb, white 20%, transparent);
    }
  }

  &__color-switch {
    .icon {
      --icon-stroke-color: currentColor;
    }
  }

  &__locale-switch {
    display: flex;
    gap: 0.25rem;
  }
}
</style>
