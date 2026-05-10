<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'
import { Button, Card, Colors } from '@sil/ui'

const { t, tm, rt } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const planKeys = ['free', 'pro'] as const

const plans = planKeys.map((key) => {
  const featureMessages = tm(`pricing.plans.${key}.features`)
  const features = Array.isArray(featureMessages)
    ? featureMessages.map((m) => rt(m as string))
    : []
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

const faqItems = [0, 1, 2, 3, 4].map((i) => ({
  q: t(`pricing.faq.items.${i}.q`),
  a: t(`pricing.faq.items.${i}.a`),
}))

const openFaq = ref<number | null>(null)

function toggleFaq(index: number) {
  openFaq.value = openFaq.value === index ? null : index
}
</script>

<template>
  <div class="page">
    <!-- Hero -->
    <section class="section section--dark">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('pricing.eyebrow') }}</div>
          <h1 class="section__title">{{ $t('pricing.heroTitle') }}</h1>
          <p class="section__subtitle">{{ $t('pricing.heroSummary') }}</p>
        </header>
      </div>
    </section>

    <!-- Plans -->
    <section class="section section--dark-alt">
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
    <section class="section section--accent-soft">
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
    <section class="section section--accent">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title section__title--accent">
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

  &--center {
    text-align: center;
  }
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
    color: var(--color-text-muted, #8888a0);
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
    color: var(--color-text, #fff);
  }

  &__period {
    font-size: 0.95rem;
    color: var(--color-text-muted, #8888a0);
  }

  &__desc {
    color: var(--color-text-muted, #8888a0);
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
      color: var(--color-text-muted, #8888a0);
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
        background: var(--color-accent, #55c267);
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
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.2s;

    &--open {
      border-color: var(--color-accent, #55c267);
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
    color: var(--color-text, #fff);
    font-size: 1rem;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
  }

  &__toggle {
    flex-shrink: 0;
    font-size: 1.25rem;
    color: var(--color-text-muted, #8888a0);
    width: 1.5rem;
    text-align: center;
  }

  &__answer {
    padding: 0 1.25rem 1rem;

    p {
      margin: 0;
      color: var(--color-text-muted, #8888a0);
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
