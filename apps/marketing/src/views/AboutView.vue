<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'
import { Icon, Icons, Button, Section, Badge, Card, Colors } from '@sil/ui'

const { t } = useI18n()

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
  <div class="page about-page">
    <Section centered :padding="'5.5rem 0 4.5rem'">
      <div class="marketing-header marketing-header--center">
        <Badge variant="primary" size="small">{{ $t('about.eyebrow') }}</Badge>
        <h1 class="marketing-title marketing-title--hero" style="margin-top: 0.75rem;">{{ $t('about.title') }}</h1>
        <p class="marketing-subtitle">{{ $t('about.summary') }}</p>
      </div>
    </Section>

    <Section variant="alternate" class="marketing-section">
      <div class="marketing-content">
        <div class="marketing-header">
          <Badge variant="outline" size="small">{{ $t('about.principles.title') }}</Badge>
        </div>
        <div class="principles-grid">
          <Card
            v-for="(item, index) in principleItems"
            :key="index"
            variant="default"
            hoverable
          >
            <div class="principle__icon">
              <Icon :name="item.icon" size="medium" color="primary" />
            </div>
            <h2 class="principle__title">{{ item.title }}</h2>
            <p class="principle__desc">{{ item.desc }}</p>
          </Card>
        </div>
      </div>
    </Section>

    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('about.cta.heading') }}</h2>
      <div class="marketing-actions">
        <Button
          variant="default"
          :color="Colors.DARK"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('about.cta.link') }}
        </Button>
      </div>
    </Section>
  </div>
</template>

<style lang="scss">
.about-page {
  .principles-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;

    .card {
      padding: 1.5rem;
    }
  }

  .principle__icon {
    width: 3rem;
    height: 3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border-radius: 999px;
    background: var(--marketing-primary-soft);
    color: var(--pietru-red);
    transition: transform 0.25s ease;
  }

  .card:hover .principle__icon {
    transform: scale(1.08);
  }

  .principle__title {
    margin: 0 0 0.4rem;
    color: var(--pietru-navy);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .principle__desc {
    margin: 0;
    color: var(--pietru-muted);
    font-size: 0.9rem;
    line-height: 1.7;
  }
}

@media (max-width: 44em) {
  .about-page .principles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
