<script lang="ts" setup>
import { useI18n } from 'lezu-i18n/vue'
import { RouterLink } from 'vue-router'
import { Icon, Icons } from '@sil/ui'

const { t, i18n } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const featureKeys = ['send', 'capture', 'receive', 'track', 'debug', 'switch'] as const

const featureIcons: Record<string, string> = {
  send: Icons.MEDIA_MAIL,
  capture: Icons.UI_CIRCLED_VISIBLE,
  receive: Icons.ARROWS_ARROW_HEADED_DOWNLOAD,
  track: Icons.UI_ON_TARGET,
  debug: Icons.UI_CODE_BRACKETS,
  switch: Icons.ARROWS_ARROW_TRANSFER_LEFT_RIGHT,
}

const features = featureKeys.map((key) => {
  const quickRefRaw = i18n.raw(`features.list.${key}.quickRef`) as string[] | undefined
  const quickRef = Array.isArray(quickRefRaw) ? quickRefRaw : []
  return {
    key,
    title: t(`features.list.${key}.title`),
    summary: t(`features.list.${key}.summary`),
    detail: t(`features.list.${key}.detail`),
    quickRef,
    icon: featureIcons[key],
  }
})
</script>

<template>
  <div class="page features-page">
    <section class="section">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('features.eyebrow') }}</div>
          <h1 class="section__title section__title--hero">
            {{ $t('features.heroTitle') }}
          </h1>
          <p class="section__subtitle">{{ $t('features.heroSummary') }}</p>
        </header>
        <nav class="toc" aria-label="Feature sections">
          <RouterLink
            v-for="feature in features"
            :key="feature.key"
            :to="{ hash: `#${feature.key}` }"
            class="toc__link"
          >
            {{ feature.title }}
          </RouterLink>
        </nav>
      </div>
    </section>

    <section
      v-for="(feature, index) in features"
      :id="feature.key"
      :key="feature.key"
      class="section feature-section"
      :class="{ 'section--alt': index % 2 === 0 }"
    >
      <div class="section__wrap">
        <article class="feature-detail">
          <div class="feature-icon feature-detail__icon">
            <Icon :name="feature.icon" size="medium" color="primary" />
          </div>
          <div class="feature-detail__body">
            <h2 class="feature-detail__title">{{ feature.title }}</h2>
            <p class="feature-detail__summary">{{ feature.summary }}</p>
            <p class="feature-detail__detail">{{ feature.detail }}</p>
            <ul class="feature-detail__list">
              <li v-for="(item, itemIndex) in feature.quickRef" :key="itemIndex">
                {{ item }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('features.ctaTitle') }}</h2>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--dark"
            :href="dashboardUrl"
            target="_blank"
            rel="noopener"
          >
            {{ $t('features.ctaLink') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
.features-page .section:first-child {
  padding-top: 5.25rem;
}

.toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  justify-content: center;
  margin-top: 1.75rem;

  &__link {
    border: 1px solid var(--color-border);
    border-radius: var(--marketing-radius);
    padding: 0.5rem 0.75rem;
    color: var(--color-text-muted);
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;

    &:hover {
      border-color: var(--color-primary);
      color: var(--color-text);
    }
  }
}

.feature-detail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  max-width: 46rem;

  &__icon {
    margin-top: 0.15rem;
  }

  &__title {
    margin: 0 0 0.45rem;
    color: var(--color-text);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
  }

  &__summary,
  &__detail {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.7;
  }

  &__summary {
    color: var(--color-text);
  }

  &__detail {
    margin-top: 0.55rem;
  }

  &__list {
    display: grid;
    gap: 0.45rem;
    margin: 1rem 0 0;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: 1rem;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      line-height: 1.6;

      &::before {
        position: absolute;
        top: 0.58em;
        left: 0;
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 50%;
        background: var(--color-primary);
        content: '';
      }
    }
  }
}

@media (max-width: 40em) {
  .features-page .section:first-child {
    padding-top: 4rem;
  }

  .feature-detail {
    grid-template-columns: 1fr;
  }
}
</style>
