<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { RouterLink } from 'vue-router'
import { Button, Card, Icon, Icons, Colors } from '@sil/ui'

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

const problemPoints = [0, 1, 2].map((i) => ({
  title: t(`home.problem.points.${i}.title`),
  desc: t(`home.problem.points.${i}.desc`),
}))

const steps = [0, 1, 2].map((i) => ({
  num: t(`home.howItWorks.steps.${i}.num`),
  title: t(`home.howItWorks.steps.${i}.title`),
  desc: t(`home.howItWorks.steps.${i}.desc`),
}))
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="section section--primary-soft">
      <div class="section__wrap">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('home.eyebrow') }}</div>
          <h1 class="section__title section__title--hero">
            {{ $t('home.heroHeading') }}
          </h1>
          <p class="section__subtitle">{{ $t('home.heroSummary') }}</p>
        </header>
        <div class="hero__actions">
          <Button
            variant="primary"
            :href="dashboardUrl"
            target="_blank"
            size="large"
          >
            {{ $t('home.getStarted') }}
          </Button>
          <RouterLink to="/features">
            <Button variant="ghost" size="large">
              {{ $t('home.seeHowItWorks') }}
            </Button>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Problem -->
    <section class="section section--surface">
      <div class="section__wrap">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('home.problem.eyebrow') }}</div>
          <h2 class="section__title">{{ $t('home.problem.title') }}</h2>
        </header>
        <div class="card-grid">
          <Card v-for="(point, i) in problemPoints" :key="i" variant="ghost">
            <h3 class="card__title">{{ point.title }}</h3>
            <p class="card__desc">{{ point.desc }}</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section">
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

    <!-- Features -->
    <section class="section section--surface-accent">
      <div class="section__wrap">
        <header class="section__header">
          <h2 class="section__title">{{ $t('home.features.sectionHeading') }}</h2>
        </header>
        <div class="feature-grid">
          <Card
            v-for="f in features"
            :key="f.key"
            variant="ghost"
            class="feature-card"
          >
            <div class="feature-card__icon">
              <Icon :name="f.icon" size="large" color="primary" />
            </div>
            <h3 class="feature-card__title">{{ f.title }}</h3>
            <p class="feature-card__desc">{{ f.desc }}</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section--primary">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">
          {{ $t('home.cta.heading') }}
        </h2>
        <p class="section__subtitle section__subtitle--on-primary">
          {{ $t('home.cta.summary') }}
        </p>
        <Button
          variant="primary"
          :href="dashboardUrl"
          target="_blank"
          size="large"
          :color="Colors.DARK"
        >
          {{ $t('home.cta.button') }}
        </Button>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="section section--secondary">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('home.finalCta.heading') }}</h2>
        <Button
          variant="primary"
          :href="dashboardUrl"
          target="_blank"
          size="large"
          :color="Colors.DARK"
        >
          {{ $t('home.cta.button') }}
        </Button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* ── hero ── */
.hero__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 2rem;
}

.section__title--hero {
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  margin-bottom: 1.5rem;
}

.section__subtitle--on-primary {
  opacity: 0.85;
}

/* ── card grid (problem section) ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.card__title {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--marketing-ink);
}

.card__desc {
  color: var(--marketing-ink-soft);
  line-height: 1.55;
  font-size: 0.95rem;
}

/* ── steps ── */
.steps {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 36rem;
}

.step {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;

  &__num {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--marketing-primary);
    color: var(--marketing-primary-ink);
    font-weight: 700;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__title {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
    color: var(--marketing-ink);
  }

  &__desc {
    color: var(--marketing-ink-soft);
    line-height: 1.55;
    font-size: 0.95rem;
    margin: 0;
  }
}

/* ── feature grid ── */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.feature-card {
  &__icon {
    margin-bottom: 0.75rem;
  }

  &__title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.4rem;
    color: var(--marketing-ink);
  }

  &__desc {
    color: var(--marketing-ink-soft);
    line-height: 1.55;
    font-size: 0.9rem;
  }
}

/* ── responsive ── */
@media (max-width: 64em) {
  .card-grid,
  .feature-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 40em) {
  .card-grid,
  .feature-grid {
    grid-template-columns: 1fr;
  }
}
</style>
