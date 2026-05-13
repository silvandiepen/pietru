<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Card, Icon, Section } from '@sil/ui'

defineProps<{
  eyebrow: string
  items: Array<{
    title: string
    desc: string
    icon: string
  }>
}>()

const bemm = useBemm('about-principles', { includeBaseClass: true })
</script>

<template>
  <Section variant="alternate" :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header')">
        <Badge variant="outline" size="small">{{ eyebrow }}</Badge>
      </div>
      <div :class="bemm('grid')">
        <Card
          v-for="(item, index) in items"
          :key="index"
          :class="bemm('card')"
          variant="default"
          hoverable
        >
          <div :class="bemm('icon')">
            <Icon :name="item.icon" size="medium" color="primary" />
          </div>
          <h2 :class="bemm('title')">{{ item.title }}</h2>
          <p :class="bemm('desc')">{{ item.desc }}</p>
        </Card>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.about-principles {
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
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
  }

  &__card {
    padding: 1.5rem;
  }

  &__icon {
    width: 3rem;
    height: 3rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    border-radius: 999px;
    background: var(--marketing-primary-soft);
    color: var(--pietru-red);
    transition: transform 0.25s ease;
  }

  &__card:hover &__icon {
    transform: scale(1.08);
  }

  &__title {
    margin: 0 0 0.4rem;
    color: var(--pietru-navy);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  &__desc {
    margin: 0;
    color: var(--pietru-muted);
    font-size: 0.9rem;
    line-height: 1.7;
  }
}

@media (max-width: 44em) {
  .about-principles {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 30em) {
  .about-principles {
    &__content {
      padding-inline: 1.25rem;
    }
  }
}
</style>
