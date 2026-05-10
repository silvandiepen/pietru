<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { RouterLink } from 'vue-router'
import { Icon, Icons } from '@sil/ui'

const { t } = useI18n()

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

const features = featureKeys.map((key) => ({
  key,
  title: t(`home.features.${key}.title`),
  desc: t(`home.features.${key}.desc`),
  icon: featureIcons[key],
}))

const steps = [0, 1, 2].map((i) => ({
  num: t(`home.howItWorks.steps.${i}.num`),
  title: t(`home.howItWorks.steps.${i}.title`),
  desc: t(`home.howItWorks.steps.${i}.desc`),
}))
</script>

<template>
  <div class="home">
    <section class="section home-hero">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('home.eyebrow') }}</div>
          <h1 class="section__title section__title--hero">
            {{ $t('home.heroHeading') }}
          </h1>
          <p class="section__subtitle">{{ $t('home.heroSummary') }}</p>
        </header>
        <p class="sr-only">{{ $t('home.problem.title') }}</p>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--primary"
            :href="dashboardUrl"
            target="_blank"
            rel="noopener"
          >
            {{ $t('home.getStarted') }}
          </a>
          <RouterLink class="marketing-button marketing-button--ghost" to="/features">
            {{ $t('home.seeHowItWorks') }}
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('home.howItWorks.eyebrow') }}</div>
          <h2 class="section__title">{{ $t('home.howItWorks.title') }}</h2>
        </header>
        <div class="steps">
          <div v-for="step in steps" :key="step.num" class="step">
            <div class="step__num">{{ step.num }}</div>
            <div class="step__content">
              <h3 class="step__title">{{ step.title }}</h3>
              <p class="step__desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__wrap">
        <header class="section__header">
          <h2 class="section__title">{{ $t('home.features.sectionHeading') }}</h2>
        </header>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.key" class="feature-item">
            <div class="feature-icon">
              <Icon :name="feature.icon" size="medium" color="primary" />
            </div>
            <h3 class="feature-item__title">{{ feature.title }}</h3>
            <p class="feature-item__desc">{{ feature.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('home.cta.heading') }}</h2>
        <p class="section__subtitle">{{ $t('home.cta.summary') }}</p>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--dark"
            :href="dashboardUrl"
            target="_blank"
            rel="noopener"
          >
            {{ $t('home.cta.button') }}
          </a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('home.finalCta.heading') }}</h2>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--ghost"
            :href="dashboardUrl"
            target="_blank"
            rel="noopener"
          >
            {{ $t('home.cta.button') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
.home-hero {
  padding-top: 5.25rem;
}

.steps {
  display: grid;
  max-width: 42rem;
  gap: 1.25rem;
}

.step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1rem;
  align-items: start;

  &__num {
    width: 2rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--marketing-primary-soft);
    color: var(--color-primary);
    font-size: 0.78rem;
    font-weight: 700;
  }

  &__title {
    margin: 0 0 0.35rem;
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.7;
  }
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem 1.5rem;
}

.feature-item {
  min-width: 0;

  &__title {
    margin: 0.85rem 0 0.35rem;
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    font-weight: 400;
    line-height: 1.7;
  }
}

@media (max-width: 56em) {
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 38em) {
  .home-hero {
    padding-top: 4rem;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
