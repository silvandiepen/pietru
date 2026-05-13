<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from 'lezu-i18n/vue'
import PricingCtaSection from '@/components/pricing/PricingCtaSection.vue'
import PricingFaqSection from '@/components/pricing/PricingFaqSection.vue'
import PricingHeroSection from '@/components/pricing/PricingHeroSection.vue'
import PricingPlansSection from '@/components/pricing/PricingPlansSection.vue'

const { t, i18n } = useI18n()
const bemm = useBemm('pricing-page', { includeBaseClass: true })

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
  <div :class="bemm()">
    <PricingHeroSection
      :eyebrow="$t('pricing.eyebrow')"
      :title="$t('pricing.heroTitle')"
      :summary="$t('pricing.heroSummary')"
    />

    <PricingPlansSection
      :plans="plans"
      :popular-label="$t('pricing.popular')"
      :dashboard-url="dashboardUrl"
    />

    <PricingFaqSection :title="$t('pricing.faq.title')" :items="faqItems" />

    <PricingCtaSection
      :title="$t('pricing.cta.heading')"
      :button-label="`${$t('pricing.cta.button')} →`"
      :dashboard-url="dashboardUrl"
    />
  </div>
</template>
