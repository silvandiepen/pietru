<script setup lang="ts">
import { useBemm } from 'bemm'
import { Button, Colors, Section } from '@sil/ui'

defineProps<{
  dashboardUrl: string
  title: string
  summary: string
  buttonLabel: string
}>()

const bemm = useBemm('home-cta', { includeBaseClass: true })
</script>

<template>
  <Section variant="cta" centered :class="bemm()">
    <h2 :class="bemm('title')">{{ title }}</h2>
    <p :class="bemm('summary')">{{ summary }}</p>
    <div :class="bemm('actions')">
      <Button variant="default" :color="Colors.DARK" :href="dashboardUrl" target="_blank">
        {{ buttonLabel }}
      </Button>
    </div>
  </Section>
</template>

<style lang="scss">
.home-cta {
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

  &__summary {
    max-width: 38rem;
    margin: 1rem auto 0;
    color: var(--color-background);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.7;
    opacity: 0.85;
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
