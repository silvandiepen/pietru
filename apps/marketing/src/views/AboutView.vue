<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button, Card, Colors } from '@sil/ui'

const { t } = useI18n()

const principleItems = [0, 1, 2, 3].map((i) => ({
  title: t(`about.principles.items.${i}.title`),
  desc: t(`about.principles.items.${i}.desc`),
}))
</script>

<template>
  <div class="page">
    <!-- Hero -->
    <section class="section section--dark">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('about.eyebrow') }}</div>
          <h1 class="section__title">{{ $t('about.title') }}</h1>
          <p class="section__subtitle">{{ $t('about.summary') }}</p>
        </header>
      </div>
    </section>

    <!-- Principles -->
    <section class="section section--warm">
      <div class="section__wrap">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('about.principles.title') }}</div>
        </header>
        <div class="principles-grid">
          <Card v-for="(item, i) in principleItems" :key="i" variant="ghost">
            <h3 class="principle__title">{{ item.title }}</h3>
            <p class="principle__desc">{{ item.desc }}</p>
          </Card>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section--accent">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title section__title--accent">
          {{ $t('about.cta.heading') }}
        </h2>
        <Button
          variant="primary"
          href="https://hakobs.com"
          target="_blank"
          size="large"
          :color="Colors.DARK"
        >
          {{ $t('about.cta.link') }}
        </Button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.section {
  width: 100%;
  padding: 6rem 0;

  &--dark {
    background: #020b22;
  }

  &--accent {
    background: var(--color-accent, #55c267);
    color: #0d1a0f;
    padding: 5rem 0;
  }

  &--warm {
    background: color-mix(in srgb, #f97316 8%, #020b22);
    color: #fff;
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
  margin-bottom: 2rem;
}

.section__eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted, #8888a0);
  margin-bottom: 1rem;
}

.section__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  color: var(--color-text, #fff);

  &--accent {
    color: #0d1a0f;
  }
}

.section__subtitle {
  color: var(--color-text-muted, #8888a0);
  max-width: 40rem;
  line-height: 1.6;
  margin: 1rem auto 0;
}

/* ── principles grid ── */
.principles-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}

.principle {
  &__title {
    font-size: 1.15rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--color-text, #fff);
  }

  &__desc {
    color: var(--color-text-muted, #8888a0);
    line-height: 1.6;
    font-size: 0.95rem;
    margin: 0;
  }
}

/* ── responsive ── */
@media (max-width: 48em) {
  .principles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
