<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Section } from '@sil/ui'

defineProps<{
  eyebrow: string
  title: string
  summary: string
}>()

const bemm = useBemm('pricing-hero', { includeBaseClass: true })
</script>

<template>
  <Section centered :padding="'5.5rem 0 4.5rem'" :class="bemm()">
    <div :class="bemm('header', 'center')">
      <Badge variant="primary" size="small">{{ eyebrow }}</Badge>
      <h1 :class="bemm('title', 'hero')">{{ title }}</h1>
      <p :class="bemm('summary')">{{ summary }}</p>
    </div>
  </Section>
</template>

<style lang="scss">
.pricing-hero {
  &__header {
    max-width: 42rem;
    margin: 0 0 2.5rem;

    &--center {
      margin-inline: auto;
      text-align: center;
    }
  }

  &__title {
    margin: 0.75rem 0 0;
    color: var(--color-foreground);
    transition: color 0.3s ease;

    &--hero {
      letter-spacing: -0.025em;
      font-size: var(--font-size-xxl);
      font-weight: 500;
      line-height: 1;
    }
  }

  &__summary {
    max-width: 38rem;
    margin: 1rem auto 0;
    color: var(--color-foreground-muted);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.7;
  }
}
</style>
