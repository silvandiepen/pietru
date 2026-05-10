<script lang="ts" setup>
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { Button, Icon, Icons, Colors } from '@sil/ui'

const { t, tm, rt } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app-pietru.hakobs.com'

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
  const messages = tm(`features.list.${key}.quickRef`)
  const quickRef = Array.isArray(messages)
    ? messages.map((m) => rt(m as string))
    : []
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
  <div class="page">
    <!-- Hero -->
    <section class="section section--dark">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('features.eyebrow') }}</div>
          <h1 class="section__title">{{ $t('features.heroTitle') }}</h1>
          <p class="section__subtitle">{{ $t('features.heroSummary') }}</p>
        </header>
        <nav class="toc">
          <RouterLink
            v-for="f in features"
            :key="f.key"
            :to="{ hash: `#${f.key}` }"
            class="toc__pill"
          >
            {{ f.title }}
          </RouterLink>
        </nav>
      </div>
    </section>

    <!-- Feature detail sections -->
    <section
      v-for="(feature, i) in features"
      :id="feature.key"
      :key="feature.key"
      class="section feature-section"
      :class="i % 2 === 0 ? 'section--accent-soft' : 'section--accent-alt'"
    >
      <div class="section__wrap">
        <div class="feature-detail">
          <div class="feature-detail__icon">
            <Icon :name="feature.icon" size="xl" color="primary" />
          </div>
          <div class="feature-detail__body">
            <h2 class="feature-detail__title">{{ feature.title }}</h2>
            <p class="feature-detail__summary">{{ feature.summary }}</p>
            <p class="feature-detail__detail">{{ feature.detail }}</p>
            <ul class="feature-detail__list">
              <li v-for="(item, j) in feature.quickRef" :key="j">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="section section--accent">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title section__title--accent">
          {{ $t('features.ctaTitle') }}
        </h2>
        <Button
          variant="primary"
          :href="dashboardUrl"
          target="_blank"
          size="large"
          :color="Colors.DARK"
        >
          {{ $t('features.ctaLink') }}
        </Button>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* ── sections ── */
.section {
  width: 100%;
  padding: 6rem 0;

  &--dark {
    background: #020b22;
  }

  &--accent {
    background: var(--color-accent, #55c267);
    color: #0d1a0f;
    padding: 5rem 0;
  }

  &--accent-soft {
    background: color-mix(in srgb, var(--color-accent, #55c267) 6%, #020b22);
  }

  &--accent-alt {
    background: color-mix(in srgb, var(--color-accent, #55c267) 3%, #0a1628);
  }
}

.section__wrap {
  max-width: 64rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 6vw, 4rem);

  &--center {
    text-align: center;
  }
}

.section__header {
  margin-bottom: 2rem;
}

.section__eyebrow {
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted, #8888a0);
  margin-bottom: 1rem;
}

.section__title {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  color: var(--color-text, #fff);

  &--accent {
    color: #0d1a0f;
  }
}

.section__subtitle {
  color: var(--color-text-muted, #8888a0);
  max-width: 40rem;
  line-height: 1.6;
  margin: 1rem auto 0;
}

/* ── table of contents pills ── */
.toc {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-top: 2rem;

  &__pill {
    padding: 0.4rem 1rem;
    border-radius: 9999px;
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--color-text-muted, #8888a0);
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-decoration: none;
    transition: all 0.2s;

    &:hover {
      color: var(--color-text, #fff);
      border-color: var(--color-accent, #55c267);
    }
  }
}

/* ── feature detail sections ── */
.feature-detail {
  display: flex;
  gap: 2.5rem;
  align-items: flex-start;

  &__icon {
    flex-shrink: 0;
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.04);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text, #fff);
    margin: 0 0 0.5rem;
  }

  &__summary {
    font-size: 1.05rem;
    color: var(--color-text, #fff);
    opacity: 0.9;
    margin: 0 0 0.75rem;
    line-height: 1.5;
  }

  &__detail {
    color: var(--color-text-muted, #8888a0);
    line-height: 1.6;
    margin: 0 0 1.25rem;
    max-width: 40rem;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    li {
      font-size: 0.9rem;
      color: var(--color-text-muted, #8888a0);
      padding-left: 1.25rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.55em;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--color-accent, #55c267);
      }
    }
  }
}

/* ── responsive ── */
@media (max-width: 48em) {
  .feature-detail {
    flex-direction: column;
    gap: 1.25rem;

    &__icon {
      width: 3rem;
      height: 3rem;
    }
  }
}
</style>
