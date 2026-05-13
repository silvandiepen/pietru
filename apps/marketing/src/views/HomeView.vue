<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from 'lezu-i18n/vue'
import { Icons } from '@sil/ui'
import HomeCtaSection from '@/components/home/HomeCtaSection.vue'
import HomeEnvironmentsSection from '@/components/home/HomeEnvironmentsSection.vue'
import HomeFeaturesSection from '@/components/home/HomeFeaturesSection.vue'
import HomeHeroSection from '@/components/home/HomeHeroSection.vue'
import HomeHowItWorksSection from '@/components/home/HomeHowItWorksSection.vue'

const { t } = useI18n()
const bemm = useBemm('home', { includeBaseClass: true })

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

const howItWorksSteps = [
  {
    title: t('home.howItWorks.step1.title'),
    description: t('home.howItWorks.step1.desc'),
  },
  {
    title: t('home.howItWorks.step2.title'),
    description: t('home.howItWorks.step2.desc'),
  },
  {
    title: t('home.howItWorks.step3.title'),
    description: t('home.howItWorks.step3.desc'),
  },
]

const envKeys = ['dev', 'staging', 'prod', 'ops'] as const

const envIcons: Record<string, string> = {
  dev: Icons.UI_CODE_BRACKETS,
  staging: Icons.UI_LAYERS_2,
  prod: Icons.MEDIA_MAIL,
  ops: Icons.UI_ON_TARGET,
}

const environments = envKeys.map((key) => ({
  key,
  title: t(`home.environments.${key}.title`),
  desc: t(`home.environments.${key}.desc`),
  icon: envIcons[key],
}))
</script>

<template>
  <div :class="bemm()">
    <HomeHeroSection
      :dashboard-url="dashboardUrl"
      :title="$t('home.heroHeading')"
      :summary="$t('home.heroSummary')"
      :primary-label="`${$t('home.getStarted')} →`"
      :secondary-label="$t('home.seeHowItWorks')"
    />

    <HomeHowItWorksSection
      :eyebrow="$t('home.howItWorks.eyebrow')"
      :title="$t('home.howItWorks.title')"
      :steps="howItWorksSteps"
    />

    <HomeEnvironmentsSection
      :eyebrow="$t('home.environments.eyebrow')"
      :title="$t('home.environments.title')"
      :summary="$t('home.environments.summary')"
      :environments="environments"
    />

    <HomeFeaturesSection
      :eyebrow="$t('home.features.sectionHeading')"
      :title="$t('home.features.sectionTitle')"
      :features="features"
    />

    <HomeCtaSection
      :dashboard-url="dashboardUrl"
      :title="$t('home.cta.heading')"
      :summary="$t('home.cta.summary')"
      :button-label="`${$t('home.cta.button')} →`"
    />
  </div>
</template>
