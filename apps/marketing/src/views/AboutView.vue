<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
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
    <section class="section section--primary-soft">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('about.eyebrow') }}</div>
          <h1 class="section__title">{{ $t('about.title') }}</h1>
          <p class="section__subtitle">{{ $t('about.summary') }}</p>
        </header>
      </div>
    </section>

    <!-- Principles -->
    <section class="section section--secondary-soft">
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
    <section class="section section--primary">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">
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
    color: var(--marketing-ink);
  }

  &__desc {
    color: var(--marketing-ink-soft);
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
