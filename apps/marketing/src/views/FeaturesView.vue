<script lang="ts" setup>
import { useBemm } from 'bemm'
import { useI18n } from 'lezu-i18n/vue'
import { Icons } from '@sil/ui'
import FeaturesCtaSection from '@/components/features/FeaturesCtaSection.vue'
import FeaturesDetailSection from '@/components/features/FeaturesDetailSection.vue'
import FeaturesHeroSection from '@/components/features/FeaturesHeroSection.vue'

const { t, i18n } = useI18n()
const bemm = useBemm('features-page', { includeBaseClass: true })

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const featureKeys = ['send', 'capture', 'receive', 'track', 'debug', 'switch', 'mailing-lists', 'subscribers', 'campaigns'] as const

const featureIcons: Record<string, string> = {
  send: Icons.MEDIA_MAIL,
  capture: Icons.UI_CIRCLED_VISIBLE,
  receive: Icons.ARROWS_ARROW_HEADED_DOWNLOAD,
  track: Icons.UI_ON_TARGET,
  debug: Icons.UI_CODE_BRACKETS,
  switch: Icons.ARROWS_ARROW_TRANSFER_LEFT_RIGHT,
  'mailing-lists': Icons.UI_LAYERS_2,
  subscribers: Icons.UI_USER_S,
  campaigns: Icons.UI_CHECK_FAT,
}

const features = featureKeys.map((key) => {
  const quickRefRaw = i18n.raw(`features.list.${key}.quickRef`) as string[] | undefined
  const quickRef = Array.isArray(quickRefRaw) ? quickRefRaw : []
  return {
    key,
    title: t(`features.list.${key}.title`),
    summary: t(`features.list.${key}.summary`),
    detail: t(`features.list.${key}.detail`),
    quickRef,
    icon: featureIcons[key],
  }
})
</script>

<template>
  <div :class="bemm()">
    <FeaturesHeroSection
      :eyebrow="$t('features.eyebrow')"
      :title="$t('features.heroTitle')"
      :summary="$t('features.heroSummary')"
      :features="features"
    />

    <FeaturesDetailSection
      v-for="(feature, index) in features"
      :key="feature.key"
      :feature="feature"
      :index="index"
    />

    <FeaturesCtaSection
      :title="$t('features.ctaTitle')"
      :button-label="`${$t('features.ctaLink')} →`"
      :dashboard-url="dashboardUrl"
    />
  </div>
</template>
