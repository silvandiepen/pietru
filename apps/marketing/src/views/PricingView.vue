<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { ref } from 'vue'
import { Button, Card, Colors } from '@sil/ui'

const { t, i18n } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const planKeys = ['free', 'pro'] as const

const plans = planKeys.map((key) => {
  const featureRaw = i18n.raw(`pricing.plans.${key}.features`) as string[] | undefined
  const features = Array.isArray(featureRaw) ? featureRaw : []
  return {
    key,
    name: t(`pricing.plans.${key}.name`),
    price: t(`pricing.plans.${key}.price`),
    period: t(`pricing.plans.${key}.period`),
    description: t(`pricing.plans.${key}.description`),
    features,
    cta: t(`pricing.plans.${key}.cta`),
  }
})

const faqRaw = i18n.raw('pricing.faq.items') as Array<{ q: string; a: string }> | undefined
const faqItems = Array.isArray(faqRaw) ? faqRaw : []

const openFaq = ref<number | null>(null)

function toggleFaq(index: number) {
  openFaq.value = openFaq.value === index ? null : index
}
</script>

<template>
  <div class="page">
    <!-- Hero -->
    <section class="section section--primary-soft">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('pricing.eyebrow') }}</div>
          <h1 class="section__title">{{ $t('pricing.heroTitle') }}</h1>
          <p class="section__subtitle">{{ $t('pricing.heroSummary') }}</p>
        </header>
      </div>
    </section>

    <!-- Plans -->
    <section class="section section--surface">
      <div class="section__wrap">
        <div class="plans-grid">
          <Card
            v-for="plan in plans"
            :key="plan.key"
            variant="ghost"
            class="plan-card"
          >
            <h3 class="plan-card__name">{{ plan.name }}</h3>
            <div class="plan-card__price">
              <span class="plan-card__amount">{{ plan.price }}</span>
              <span class="plan-card__period">/ {{ plan.period }}</span>
            </div>
            <p class="plan-card__desc">{{ plan.description }}</p>
            <ul class="plan-card__features">
              <li v-for="(feat, i) in plan.features" :key="i">
                {{ feat }}
              </li>
            </ul>
            <Button
              variant="primary"
              :href="dashboardUrl"
              target="_blank"
              size="large"
              class="plan-card__cta"
            >
              {{ plan.cta }}
            </Button>
          </Card>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section">
      <div class="section__wrap">
        <header class="section__header section__header--center">
          <h2 class="section__title">{{ $t('pricing.faq.title') }}</h2>
        </header>
        <div class="faq">
          <div
            v-for="(item, i) in faqItems"
            :key="i"
            class="faq__item"
            :class="{ 'faq__item--open': openFaq === i }"
          >
            <button class="faq__question" @click="toggleFaq(i)">
              <span>{{ item.q }}</span>
              <span class="faq__toggle">{{ openFaq === i ? '−' : '+' }}</span>
            </button>
            <div v-if="openFaq === i" class="faq__answer">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section--primary">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">
          {{ $t('pricing.cta.heading') }}
        </h2>
        <Button
          variant="primary"
          :href="dashboardUrl"
          target="_blank"
          size="large"
          :color="Colors.DARK"
        >
          {{ $t('pricing.cta.button') }}
        </Button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* ── plans grid ── */
.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 48rem;
  margin-inline: auto;
}

.plan-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;

  &__name {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--marketing-ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 0.75rem;
  }

  &__price {
    margin-bottom: 0.75rem;
  }

  &__amount {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    font-weight: 700;
    color: var(--marketing-ink);
  }

  &__period {
    font-size: 0.95rem;
    color: var(--marketing-ink-soft);
  }

  &__desc {
    color: var(--marketing-ink-soft);
    line-height: 1.55;
    font-size: 0.95rem;
    margin: 0 0 1.5rem;
  }

  &__features {
    list-style: none;
    padding: 0;
    margin: 0 0 2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    li {
      font-size: 0.9rem;
      color: var(--marketing-ink-soft);
      padding-left: 1.5rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.5em;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--marketing-primary);
      }
    }
  }
}

/* ── FAQ ── */
.faq {
  max-width: 40rem;
  margin-inline: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &__item {
    border: 1px solid var(--marketing-border);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;

    &--open {
      border-color: var(--marketing-primary);
    }
  }

  &__question {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.25rem;
    background: none;
    border: none;
    color: var(--marketing-ink);
    font-size: 1rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }

  &__toggle {
    flex-shrink: 0;
    font-size: 1.25rem;
    color: var(--marketing-ink-soft);
    width: 1.5rem;
    text-align: center;
  }

  &__answer {
    padding: 0 1.25rem 1rem;

    p {
      margin: 0;
      color: var(--marketing-ink-soft);
      line-height: 1.6;
      font-size: 0.95rem;
    }
  }
}

/* ── responsive ── */
@media (max-width: 48em) {
  .plans-grid {
    grid-template-columns: 1fr;
    max-width: 24rem;
  }
}
</style>
