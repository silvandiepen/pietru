<script setup lang="ts">
import { useI18n } from 'lezu-i18n/vue'

const { t } = useI18n()

const principleItems = [0, 1, 2, 3].map((i) => ({
  title: t(`about.principles.items.${i}.title`),
  desc: t(`about.principles.items.${i}.desc`),
}))
</script>

<template>
  <div class="page about-page">
    <section class="section">
      <div class="section__wrap section__wrap--center">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('about.eyebrow') }}</div>
          <h1 class="section__title section__title--hero">{{ $t('about.title') }}</h1>
          <p class="section__subtitle">{{ $t('about.summary') }}</p>
        </header>
      </div>
    </section>

    <section class="section section--alt">
      <div class="section__wrap">
        <header class="section__header">
          <div class="section__eyebrow">{{ $t('about.principles.title') }}</div>
        </header>
        <div class="principles-grid">
          <article v-for="(item, index) in principleItems" :key="index" class="principle">
            <h2 class="principle__title">{{ item.title }}</h2>
            <p class="principle__desc">{{ item.desc }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section__wrap section__wrap--center">
        <h2 class="section__title">{{ $t('about.cta.heading') }}</h2>
        <div class="button-row">
          <a
            class="marketing-button marketing-button--dark"
            href="https://hakobs.com"
            target="_blank"
            rel="noopener"
          >
            {{ $t('about.cta.link') }}
          </a>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss">
.about-page .section:first-child {
  padding-top: 5.25rem;
}

.principles-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem 2rem;
}

.principle {
  min-width: 0;

  &__title {
    margin: 0 0 0.4rem;
    color: var(--color-text);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.85rem;
    line-height: 1.7;
  }
}

@media (max-width: 42em) {
  .about-page .section:first-child {
    padding-top: 4rem;
  }

  .principles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
