<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { Icon, Icons, Button, Section } from '@sil/ui'

const { t } = useI18n()

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
  <div class="page about-page">
    <Section centered :padding="'5.5rem 0 4.5rem'">
      <div class="marketing-header marketing-header--center">
        <div class="marketing-eyebrow">{{ $t('about.eyebrow') }}</div>
        <h1 class="marketing-title marketing-title--hero">{{ $t('about.title') }}</h1>
        <p class="marketing-subtitle">{{ $t('about.summary') }}</p>
      </div>
    </Section>

    <Section variant="alternate" class="marketing-section">
      <div class="marketing-content">
        <div class="marketing-header">
          <div class="marketing-eyebrow">{{ $t('about.principles.title') }}</div>
        </div>
        <div class="principles-grid">
          <article v-for="(item, index) in principleItems" :key="index" class="principle">
            <div class="principle__icon">
              <Icon :name="item.icon" size="medium" color="primary" />
            </div>
            <h2 class="principle__title">{{ item.title }}</h2>
            <p class="principle__desc">{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </Section>

    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('about.cta.heading') }}</h2>
      <div class="marketing-actions">
        <Button
          variant="default"
          color="dark"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('about.cta.link') }}
        </Button>
      </div>
    </Section>
  </div>
</template>
