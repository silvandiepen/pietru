<script setup lang="ts">
import { useBemm } from 'bemm'
import { Button, Colors, Section } from '@sil/ui'

defineProps<{
  title: string
  buttonLabel: string
  dashboardUrl: string
}>()

const bemm = useBemm('pricing-cta', { includeBaseClass: true })
</script>

<template>
  <Section variant="cta" centered :class="bemm()">
    <h2 :class="bemm('title')">{{ title }}</h2>
    <div :class="bemm('actions')">
      <Button variant="default" :color="Colors.DARK" :href="dashboardUrl" target="_blank">
        {{ buttonLabel }}
      </Button>
    </div>
  </Section>
</template>

<style lang="scss">
.pricing-cta {
  position: relative;
  overflow: hidden;
  background: var(--color-primary);
  padding-block: 5rem;
  min-height: 0 !important;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255, 255, 255, 0.04), transparent),
      radial-gradient(ellipse 50% 60% at 80% 30%, rgba(255, 255, 255, 0.03), transparent);
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &__title {
    margin: 0;
    color: var(--color-background);
    font-size: clamp(1.45rem, 2.4vw, 1.75rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
    margin-top: 2rem;
  }
}
</style>
