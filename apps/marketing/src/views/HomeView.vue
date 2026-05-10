<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Button, Card, Icon, Icons, Colors } from '@sil/ui'

const { t } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app-pietru.hakobs.com'

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
    <section class="section section--dark">
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
    <section class="section section--dark-alt">
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
    <section class="section section--accent-soft">
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
    <section class="section section--dark-alt">
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

    <!-- Social proof / CTA -->
    <section class="section section--accent">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title section__title--accent">
          {{ $t('home.cta.heading') }}
        </h2>
        <p class="section__subtitle section__subtitle--accent">
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
    <section class="section section--warm">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title section__title--warm">{{ $t('home.finalCta.heading') }}</h2>
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
/* ── sections ── */
.section {
  width: 100%;
  padding: 6rem 0;

  &--dark {
    background: #020b22;
  }

  &--dark-alt {
    background: #0a1628;
  }

  &--accent {
    background: var(--color-accent, #55c267);
    color: #0d1a0f;
    padding: 5rem 0;
  }

  &--accent-soft {
    background: color-mix(in srgb, var(--color-accent, #55c267) 6%, #020b22);
  }

  &--warm {
    background: color-mix(in srgb, #f97316 8%, #020b22);
    color: #fff;
    padding: 4.5rem 0;
  }
}

.section__wrap {
  max-width: 64rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 6vw, 4rem);

  &--center {
    text-align: center;
  }
}

.section__header {
  margin-bottom: 3rem;
}

.section__eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted, #8888a0);
  margin-bottom: 1rem;
}

.section__title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  color: var(--color-text, #fff);

  &--hero {
    font-size: clamp(2.25rem, 5vw, 3.5rem);
    margin-bottom: 1.5rem;
  }

  &--accent {
    color: #0d1a0f;
  }

  &--warm {
    color: #fff;
  }
}

.section__subtitle {
  color: var(--color-text-muted, #8888a0);
  max-width: 40rem;
  line-height: 1.6;
  margin-top: 1rem;

  &--accent {
    color: #0d1a0f;
    opacity: 0.85;
  }
}

/* ── hero actions ── */
.hero {
  &__actions {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 2rem;
  }
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
  color: var(--color-text, #fff);
}

.card__desc {
  color: var(--color-text-muted, #8888a0);
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
    background: var(--color-accent, #55c267);
    color: #0d1a0f;
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
    color: var(--color-text, #fff);
  }

  &__desc {
    color: var(--color-text-muted, #8888a0);
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
    color: var(--color-text, #fff);
  }

  &__desc {
    color: var(--color-text-muted, #8888a0);
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

  .section {
    padding: 4rem 0;
  }
}
</style>
