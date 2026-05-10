<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { ref } from 'vue'

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
  <div class="page pricing-page">
    <section class="section">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('pricing.eyebrow') }}</div>
          <h1 class="section__title section__title--hero">
            {{ $t('pricing.heroTitle') }}
          </h1>
          <p class="section__subtitle">{{ $t('pricing.heroSummary') }}</p>
        </header>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap">
        <div class="plans-grid">
          <article v-for="plan in plans" :key="plan.key" class="plan">
            <h2 class="plan__name">{{ plan.name }}</h2>
            <div class="plan__price">
              <span class="plan__amount">{{ plan.price }}</span>
              <span class="plan__period">/ {{ plan.period }}</span>
            </div>
            <p class="plan__desc">{{ plan.description }}</p>
            <ul class="plan__features">
              <li v-for="(feature, index) in plan.features" :key="index">
                {{ feature }}
              </li>
            </ul>
            <a
              class="marketing-button marketing-button--primary plan__cta"
              :href="dashboardUrl"
              target="_blank"
              rel="noopener"
            >
              {{ plan.cta }}
            </a>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__wrap">
        <header class="section__header section__header--center">
          <h2 class="section__title">{{ $t('pricing.faq.title') }}</h2>
        </header>
        <div class="faq">
          <div
            v-for="(item, index) in faqItems"
            :key="index"
            class="faq__item"
            :class="{ 'faq__item--open': openFaq === index }"
          >
            <button class="faq__question" type="button" @click="toggleFaq(index)">
              <span>{{ item.q }}</span>
              <span class="faq__toggle">{{ openFaq === index ? '-' : '+' }}</span>
            </button>
            <div v-if="openFaq === index" class="faq__answer">
              <p>{{ item.a }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('pricing.cta.heading') }}</h2>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--dark"
            :href="dashboardUrl"
            target="_blank"
            rel="noopener"
          >
            {{ $t('pricing.cta.button') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
.pricing-page .section:first-child {
  padding-top: 5.25rem;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  max-width: 44rem;
  margin-inline: auto;
}

.plan {
  display: flex;
  min-width: 0;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--marketing-radius);
  background: #ffffff;
  padding: 1.35rem;

  &__name {
    margin: 0 0 0.75rem;
    color: var(--color-primary);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 2px;
    line-height: 1.3;
    text-transform: uppercase;
  }

  &__price {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: baseline;
    margin-bottom: 0.65rem;
  }

  &__amount {
    color: var(--color-text);
    font-size: 1.85rem;
    font-weight: 800;
    line-height: 1;
  }

  &__period {
    color: var(--color-text-muted);
    font-size: 0.8rem;
  }

  &__desc {
    margin: 0 0 1rem;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    line-height: 1.7;
  }

  &__features {
    display: grid;
    gap: 0.45rem;
    margin: 0 0 1.25rem;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: 1rem;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      line-height: 1.55;

      &::before {
        position: absolute;
        top: 0.56em;
        left: 0;
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 50%;
        background: var(--color-primary);
        content: '';
      }
    }
  }

  &__cta {
    width: fit-content;
    margin-top: auto;
  }
}

.faq {
  display: grid;
  max-width: 44rem;
  gap: 0.55rem;
  margin-inline: auto;

  &__item {
    border: 1px solid var(--color-border);
    border-radius: var(--marketing-radius);
    background: #ffffff;

    &--open {
      border-color: var(--color-primary);
    }
  }

  &__question {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    border: 0;
    background: transparent;
    padding: 0.9rem 1rem;
    color: var(--color-text);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  &__toggle {
    color: var(--color-primary);
    font-size: 1rem;
    font-weight: 700;
  }

  &__answer {
    padding: 0 1rem 0.95rem;

    p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.85rem;
      line-height: 1.7;
    }
  }
}

@media (max-width: 44em) {
  .pricing-page .section:first-child {
    padding-top: 4rem;
  }

  .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
