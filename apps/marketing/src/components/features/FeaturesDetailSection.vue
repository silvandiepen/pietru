<script setup lang="ts">
import { useBemm } from 'bemm'
import { Card, Icon, Section } from '@sil/ui'

defineProps<{
  feature: {
    key: string
    title: string
    summary: string
    detail: string
    quickRef: string[]
    icon: string
  }
  index: number
}>()

const bemm = useBemm('features-detail', { includeBaseClass: true })
</script>

<template>
  <Section
    :id="feature.key"
    :variant="index % 2 === 0 ? 'alternate' : 'default'"
    :class="bemm('', { dark: index === 2 })"
  >
    <div :class="bemm('content')">
      <Card :class="bemm('card')" variant="default" hoverable no-padding>
        <template #header>
          <div :class="bemm('header')">
            <div :class="bemm('icon')">
              <Icon :name="feature.icon" size="medium" color="primary" />
            </div>
          </div>
        </template>
        <div :class="bemm('body')">
          <h2 :class="bemm('title')">{{ feature.title }}</h2>
          <p :class="bemm('summary')">{{ feature.summary }}</p>
          <p :class="bemm('text')">{{ feature.detail }}</p>
          <ul :class="bemm('list')">
            <li v-for="(item, itemIndex) in feature.quickRef" :key="itemIndex">
              {{ item }}
            </li>
          </ul>
        </div>
      </Card>
    </div>
  </Section>
</template>

<style lang="scss">
.features-detail {
  position: relative;
  min-height: 0 !important;
  padding-block: 0 5.5rem;

  &--dark {
    background: var(--color-primary);
    color: var(--color-background);

    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        color-mix(in srgb, var(--color-background) 8%, transparent) 1px,
        transparent 1px
      );
      background-size: 24px 24px;
      pointer-events: none;
      z-index: 0;
    }

    > * {
      position: relative;
      z-index: 1;
    }

    .features-detail__card {
      background: color-mix(in srgb, var(--color-background) 5%, transparent);
      border-color: color-mix(in srgb, var(--color-background) 10%, transparent);
      box-shadow: none;
    }

    .features-detail__title,
    .features-detail__summary {
      color: var(--color-background);
    }

    .features-detail__text,
    .features-detail__list li {
      color: color-mix(in srgb, var(--color-background) 65%, transparent);
    }

    .features-detail__icon {
      background: rgba(255, 59, 31, 0.12);
      color: var(--color-primary-accent, #FF3B1F);
    }
  }

  &__content {
    max-width: var(--marketing-wrap);
    margin-inline: auto;
    padding-inline: 2rem;
  }

  &__card {
    max-width: 52rem;
  }

  &__header {
    padding: 1.5rem 1.5rem 0;
  }

  &__icon {
    width: 3rem;
    height: 3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: 999px;
    background: var(--marketing-primary-soft);
    color: var(--color-primary-accent, #FF3B1F);
  }

  &__body {
    padding: 0 1.5rem 1.5rem;
  }

  &__title {
    margin: 0 0 0.5rem;
    color: var(--color-foreground);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
  }

  &__summary,
  &__text {
    margin: 0;
    color: var(--color-foreground-muted);
    font-size: 0.9rem;
    font-weight: 400;
    line-height: 1.7;
  }

  &__summary {
    color: var(--color-foreground);
  }

  &__text {
    margin-top: 0.6rem;
  }

  &__list {
    display: grid;
    gap: 0.5rem;
    margin: 1.1rem 0 0;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: 1.15rem;
      color: var(--color-foreground-muted);
      font-size: 0.9rem;
      line-height: 1.6;

      &::before {
        position: absolute;
        top: 0.58em;
        left: 0;
        width: 0.35rem;
        height: 0.35rem;
        border-radius: 50%;
        background: var(--color-primary-accent, #FF3B1F);
        content: '';
      }
    }
  }
}

@media (max-width: 38em) {
  .features-detail {
    padding-block: 4rem;
  }
}

@media (max-width: 30em) {
  .features-detail {
    padding-block: 3rem;

    &__content {
      padding-inline: 1.25rem;
    }
  }
}
</style>
