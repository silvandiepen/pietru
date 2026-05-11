<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { Button, Section, Collapsible, Badge } from '@sil/ui'

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
</script>

<template>
  <div class="page pricing-page">
    <Section centered :padding="'5.5rem 0 4.5rem'">
      <div class="marketing-header marketing-header--center">
        <div class="marketing-eyebrow">{{ $t('pricing.eyebrow') }}</div>
        <h1 class="marketing-title marketing-title--hero">
          {{ $t('pricing.heroTitle') }}
        </h1>
        <p class="marketing-subtitle">{{ $t('pricing.heroSummary') }}</p>
      </div>
    </Section>

    <Section variant="alternate" class="marketing-section marketing-section--tight">
      <div class="marketing-content">
        <div class="plans-grid">
          <article
            v-for="plan in plans"
            :key="plan.key"
            class="plan"
            :class="{ 'plan--highlight': plan.key === 'pro' }"
          >
            <h2 class="plan__name">
              {{ plan.name }}
              <Badge v-if="plan.key === 'pro'" variant="default" size="small">
                Popular
              </Badge>
            </h2>
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
            <Button
              class="plan__cta"
              variant="primary"
              :href="dashboardUrl"
              target="_blank"
            >
              {{ plan.cta }}
            </Button>
          </article>
        </div>
      </div>
    </Section>

    <Section class="marketing-section">
      <div class="marketing-content">
        <div class="marketing-header marketing-header--center">
          <h2 class="marketing-title">{{ $t('pricing.faq.title') }}</h2>
        </div>
        <div class="faq">
          <Collapsible
            v-for="(item, index) in faqItems"
            :key="index"
            :label="item.q"
          >
            <p class="faq__answer">{{ item.a }}</p>
          </Collapsible>
        </div>
      </div>
    </Section>

    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('pricing.cta.heading') }}</h2>
      <div class="marketing-actions">
        <Button
          variant="default"
          color="dark"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('pricing.cta.button') }}
        </Button>
      </div>
    </Section>
  </div>
</template>

<style lang="scss">
.faq__answer {
  margin: 0;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
}
</style>
