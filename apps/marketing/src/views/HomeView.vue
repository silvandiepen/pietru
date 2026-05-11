<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { Icon, Icons, Button, Section, Steps } from '@sil/ui'
import type { StepItem } from '@sil/ui'

const { t } = useI18n()

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

const steps: StepItem[] = ['step1', 'step2', 'step3'].map((key) => ({
  title: t(`home.howItWorks.${key}.title`),
  description: t(`home.howItWorks.${key}.desc`),
}))
</script>

<template>
  <div class="home">
    <Section variant="hero" centered :padding="'5.5rem 0 4.5rem'">
      <div class="marketing-header marketing-header--center">
        <div class="marketing-eyebrow">{{ $t('home.eyebrow') }}</div>
        <h1 class="marketing-title marketing-title--hero">
          {{ $t('home.heroHeading') }}
        </h1>
        <p class="marketing-subtitle">{{ $t('home.heroSummary') }}</p>
      </div>
      <p class="sr-only">{{ $t('home.problem.title') }}</p>
      <div class="marketing-actions">
        <Button
          variant="primary"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('home.getStarted') }}
        </Button>
        <Button variant="outline" :to="'/features'">
          {{ $t('home.seeHowItWorks') }}
        </Button>
      </div>
    </Section>

    <Section variant="alternate" class="marketing-section marketing-section-dark">
      <div class="marketing-content">
        <div class="marketing-header">
          <div class="marketing-eyebrow">{{ $t('home.howItWorks.eyebrow') }}</div>
          <h2 class="marketing-title">{{ $t('home.howItWorks.title') }}</h2>
        </div>
        <Steps :steps="steps" direction="vertical" show-number />
      </div>
    </Section>

    <Section class="marketing-section">
      <div class="marketing-content">
        <div class="marketing-header">
          <h2 class="marketing-title">{{ $t('home.features.sectionHeading') }}</h2>
        </div>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.key" class="feature-item">
            <div class="feature-item__icon">
              <Icon :name="feature.icon" size="medium" color="primary" />
            </div>
            <h3 class="feature-item__title">{{ feature.title }}</h3>
            <p class="feature-item__desc">{{ feature.desc }}</p>
          </article>
        </div>
      </div>
    </Section>

    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('home.cta.heading') }}</h2>
      <p class="marketing-subtitle">{{ $t('home.cta.summary') }}</p>
      <div class="marketing-actions">
        <Button
          variant="default"
          color="dark"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('home.cta.button') }}
        </Button>
      </div>
    </Section>
  </div>
</template>
