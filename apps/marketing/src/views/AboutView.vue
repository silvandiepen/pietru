<script setup lang="ts">
import { useBemm } from 'bemm'
import { useI18n } from 'lezu-i18n/vue'
import { Icons } from '@sil/ui'
import AboutCtaSection from '@/components/about/AboutCtaSection.vue'
import AboutHeroSection from '@/components/about/AboutHeroSection.vue'
import AboutPrinciplesSection from '@/components/about/AboutPrinciplesSection.vue'

const { t } = useI18n()
const bemm = useBemm('about-page', { includeBaseClass: true })

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

const principleIcons = [
  Icons.UI_CHECKLIST_SUCCESS,
  Icons.MISC_SHIELD_CHECK,
  Icons.MISC_MONEY,
  Icons.UI_ON_TARGET,
]

const principleItems = [0, 1, 2, 3].map((i) => ({
  title: t(`about.principles.items.${i}.title`),
  desc: t(`about.principles.items.${i}.desc`),
  icon: principleIcons[i],
}))
</script>

<template>
  <div :class="bemm()">
    <AboutHeroSection
      :eyebrow="$t('about.eyebrow')"
      :title="$t('about.title')"
      :summary="$t('about.summary')"
    />

    <AboutPrinciplesSection
      :eyebrow="$t('about.principles.title')"
      :items="principleItems"
    />

    <AboutCtaSection
      :title="$t('about.cta.heading')"
      :button-label="$t('about.cta.link')"
      :dashboard-url="dashboardUrl"
    />
  </div>
</template>
