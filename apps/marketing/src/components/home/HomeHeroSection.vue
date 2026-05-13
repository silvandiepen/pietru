<script setup lang="ts">
import { useBemm } from 'bemm'
import { Button } from '@sil/ui'

defineProps<{
  dashboardUrl: string
  title: string
  summary: string
  primaryLabel: string
  secondaryLabel: string
}>()

const bemm = useBemm('home-hero', { includeBaseClass: true })
</script>

<template>
  <section :class="bemm()">
    <div :class="bemm('inner')">
      <div :class="bemm('panel')" />

      <div :class="bemm('content')">
        <h1 :class="bemm('title')">
          {{ title }}
        </h1>
        <p :class="bemm('summary')">{{ summary }}</p>
        <div :class="bemm('actions')">
          <Button variant="primary" :href="dashboardUrl" target="_blank">
            {{ primaryLabel }}
          </Button>
          <Button variant="ghost" to="/features">
            {{ secondaryLabel }}
          </Button>
        </div>
      </div>
    </div>
  </section>
</template>

<style lang="scss">
.home-hero {


  &__inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    height: 100%;
    max-width: 100%;
  }

  &__panel {
    background: var(--color-primary);
    background-image: url(/logo-icon-pietru.svg);
    background-position: bottom right;
    background-repeat: no-repeat;
    padding: 3rem;
    position: relative;
    overflow: hidden;
  }

  &__content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    background-color: var(--color-secondary);
    padding: calc(var(--spacing) * 2) var(--spacing) var(--spacing) var(--spacing);
  }

  &__title {
    margin: 0;
    color: var(--color-foreground);
    letter-spacing: -0.025em;
    font-size: var(--font-size-xxl);
    font-weight: 500;
    line-height: 1;
    transition: color 0.3s ease;
  }

  &__summary {
    max-width: 38rem;
    margin: 1rem 0 0;
    color: var(--color-foreground-muted);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.7;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-start;
    margin-top: 2rem;
  }
}

@media (max-width: 56em) {
  .home-hero {
    &__inner {
      grid-template-columns: 1fr;
    }

    &__panel {
      min-height: 50vh;
      padding: 0;
      background-position: bottom left !important;
    }
  }
}

</style>
