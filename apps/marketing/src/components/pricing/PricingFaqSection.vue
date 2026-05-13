<script setup lang="ts">
import { useBemm } from 'bemm'
import { Collapsible, Section } from '@sil/ui'

defineProps<{
  title: string
  items: Array<{ q: string; a: string }>
}>()

const bemm = useBemm('pricing-faq', { includeBaseClass: true })
</script>

<template>
  <Section :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header', 'center')">
        <h2 :class="bemm('title')">{{ title }}</h2>
      </div>
      <div :class="bemm('list')">
        <Collapsible
          v-for="(item, index) in items"
          :key="index"
          :label="item.q"
        >
          <p :class="bemm('answer')">{{ item.a }}</p>
        </Collapsible>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.pricing-faq {
  position: relative;
  min-height: 0 !important;
  padding-block: 0 5.5rem;

  &__content {
    max-width: var(--marketing-wrap);
    margin-inline: auto;
    padding-inline: 2rem;
  }

  &__header {
    max-width: 42rem;
    margin: 0 0 2.5rem;

    &--center {
      margin-inline: auto;
      text-align: center;
    }
  }

  &__title {
    margin: 0;
    color: var(--color-foreground);
    font-size: clamp(1.45rem, 2.4vw, 1.75rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  &__list {
    display: grid;
    max-width: 44rem;
    gap: 0.85rem;
    margin-inline: auto;
  }

  &__answer {
    margin: 0;
    color: var(--color-foreground-muted);
    font-size: 0.9rem;
    line-height: 1.7;
  }
}

@media (max-width: 30em) {
  .pricing-faq {
    &__content {
      padding-inline: 1.25rem;
    }
  }
}
</style>
