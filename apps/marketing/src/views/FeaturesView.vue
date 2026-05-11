<script lang="ts" setup>
import { useI18n } from 'lezu-i18n/vue'
import { RouterLink } from 'vue-router'
import { Icon, Icons, Button, Section } from '@sil/ui'

const { t, i18n } = useI18n()

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
  <div class="page features-page">
    <Section centered :padding="'5.5rem 0 4.5rem'">
      <div class="marketing-header marketing-header--center">
        <div class="marketing-eyebrow">{{ $t('features.eyebrow') }}</div>
        <h1 class="marketing-title marketing-title--hero">
          {{ $t('features.heroTitle') }}
        </h1>
        <p class="marketing-subtitle">{{ $t('features.heroSummary') }}</p>
      </div>
      <nav class="toc" aria-label="Feature sections">
        <RouterLink
          v-for="feature in features"
          :key="feature.key"
          :to="{ hash: `#${feature.key}` }"
        >
          <Button variant="outline" size="small">{{ feature.title }}</Button>
        </RouterLink>
      </nav>
    </Section>

    <Section
      v-for="(feature, index) in features"
      :id="feature.key"
      :key="feature.key"
      :variant="index % 2 === 0 ? 'alternate' : 'default'"
      class="marketing-section"
      :class="{ 'marketing-section-dark': index === 2 }"
    >
      <div class="marketing-content">
        <article class="feature-detail">
          <div class="feature-detail__icon">
            <div class="feature-item__icon">
              <Icon :name="feature.icon" size="medium" color="primary" />
            </div>
          </div>
          <div class="feature-detail__body">
            <h2 class="feature-detail__title">{{ feature.title }}</h2>
            <p class="feature-detail__summary">{{ feature.summary }}</p>
            <p class="feature-detail__detail">{{ feature.detail }}</p>
            <ul class="feature-detail__list">
              <li v-for="(item, itemIndex) in feature.quickRef" :key="itemIndex">
                {{ item }}
              </li>
            </ul>
          </div>
        </article>
      </div>
    </Section>

    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('features.ctaTitle') }}</h2>
      <div class="marketing-actions">
        <Button
          variant="default"
          color="dark"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('features.ctaLink') }}
        </Button>
      </div>
    </Section>
  </div>
</template>
