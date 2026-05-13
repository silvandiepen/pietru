<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Icon, Section } from '@sil/ui'

defineProps<{
  eyebrow: string
  title: string
  features: Array<{
    key: string
    title: string
    desc: string
    icon: string
  }>
}>()

const bemm = useBemm('home-features', { includeBaseClass: true })
</script>

<template>
  <Section variant="alternate" :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header')">
        <Badge variant="outline" size="small">{{ eyebrow }}</Badge>
        <h2 :class="bemm('title')">{{ title }}</h2>
      </div>
      <div :class="bemm('grid')">
        <article v-for="feature in features" :key="feature.key" :class="bemm('item')">
          <div :class="bemm('icon')">
            <Icon :name="feature.icon" size="medium" color="primary" />
          </div>
          <div :class="bemm('content')">
            <h3 :class="bemm('item-title')">{{ feature.title }}</h3>
          <p :class="bemm('desc')">{{ feature.desc }}</p>

          </div>
           </article>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.home-features {
  $b: &;
  position: relative;
  padding: var(--spacing);
  background-color: var(--color-light);
  color: var(--color-dark);

  &__content {

  }

  &__header {
    color: var(--color-primary);


  }

  &__title {

  }

  &__grid {
    display: flex; flex-direction: column;

  }

  &__item {
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    gap: var(--space);
    padding: var(--space-l) var(--space);
    font-size: var(--font-size-l);
    border-bottom: 2px solid color-mix(in srgb, var(--color-background), transparent 90%);
    &:last-child{border-bottom: none;}
  }

  &__icon {
    width: var(--space-xl);
    height: var(--space-xl);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 0;
    border-radius: var(--border-radius);
    background: var(--color-primary);
    font-size: 1.5em;

    color: var(--color-primary-contrast);
    transition: background 0.25s ease, transform 0.25s ease;
  }


  &__item-title {

    font-weight: 700;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--color-foreground-muted);
    font-weight: 400;
    line-height: 1.7;
  }
}

</style>
