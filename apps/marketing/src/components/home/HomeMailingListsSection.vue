<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Icon, Section } from '@sil/ui'

defineProps<{
  eyebrow: string
  title: string
  summary: string
  items: Array<{
    key: string
    title: string
    desc: string
    icon: string
  }>
}>()

const bemm = useBemm('home-mailing-lists', { includeBaseClass: true })
</script>

<template>
  <Section :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header')">
        <Badge variant="primary" size="small">{{ eyebrow }}</Badge>
        <h2 :class="bemm('title')">{{ title }}</h2>
        <p :class="bemm('summary')">{{ summary }}</p>
      </div>

      <div :class="bemm('grid')">
        <article v-for="item in items" :key="item.key" :class="bemm('item')">
          <div :class="bemm('icon')">
            <Icon :name="item.icon" size="medium" />
          </div>
          <div :class="bemm('text')">
            <h3 :class="bemm('item-title')">{{ item.title }}</h3>
            <p :class="bemm('desc')">{{ item.desc }}</p>
          </div>
        </article>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.home-mailing-lists {
  padding: var(--spacing);
  min-height: 0 !important;

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
  }

  &__header {
    display: flex;
    flex-direction: column;
    gap: var(--space);
  }

  &__title {
    font-size: var(--font-size-xxl);
    margin: 0;
  }

  &__summary {
    font-size: var(--font-size-l);
    max-width: 48rem;
    color: var(--color-foreground-muted);
    margin: 0;
    line-height: 1.7;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-l);

    @media (max-width: 60em) {
      grid-template-columns: repeat(2, 1fr);
    }

    @media (max-width: 38em) {
      grid-template-columns: 1fr;
    }
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: var(--space-s);
    padding: var(--space-l);
    border-radius: var(--border-radius-l);
    background: color-mix(in srgb, var(--color-foreground) 3%, var(--color-background));
    transition: background 0.2s ease;

    &:hover {
      background: color-mix(in srgb, var(--color-foreground) 6%, var(--color-background));
    }
  }

  &__icon {
    width: var(--space-xl);
    height: var(--space-xl);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: var(--color-background);
    font-size: 1.25em;
    flex-shrink: 0;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  &__item-title {
    font-size: var(--font-size-m);
    font-weight: 700;
    margin: 0;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--color-foreground-muted);
    font-size: var(--font-size-s);
    line-height: 1.7;
  }
}
</style>
