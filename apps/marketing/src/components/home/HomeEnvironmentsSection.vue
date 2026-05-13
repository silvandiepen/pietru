<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Icon, Section } from '@sil/ui'

defineProps<{
  eyebrow: string
  title: string
  summary: string
  environments: Array<{
    key: string
    title: string
    desc: string
    icon: string
  }>
}>()

const bemm = useBemm('home-environments', { includeBaseClass: true })
</script>

<template>
  <Section :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header')">
        <Badge variant="outline" size="small">{{ eyebrow }}</Badge>
        <h2 :class="bemm('title')">
          {{ title }}
        </h2>
        <p :class="bemm('summary')">
          {{ summary }}
        </p>
      </div>
      <div :class="bemm('grid')">
        <article v-for="env in environments" :key="env.key" :class="bemm('item')">
          <div :class="bemm('icon')">
            <Icon :name="env.icon" size="medium" />
          </div>
          <h3 :class="bemm('item-title')">{{ env.title }}</h3>
          <p :class="bemm('desc')">{{ env.desc }}</p>
        </article>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.home-environments {
  padding: var(--spacing);


  &__content {
    background-color: var(--color-primary);
    padding: var(--spacing);
    border-radius: var(--border-radius-xl);
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
  }

  &__header {

  }

  &__title {
    font-size: var(--font-size-xl);

  }

  &__summary {
    font-size: var(--font-size-l);

  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing);
    @media screen and (max-width: 960px){
      grid-template-columns: repeat(1, 1fr);

    }
  }

  &__item {
    font-size: var(--font-size-l);


    &:hover {
      background: var(--marketing-primary-soft);
    }

    &:last-child {
      border-right: none;
    }
  }

  &__icon {
color: var(--color-background);
    font-size: var(--font-size-xl);
  }



  &__item-title {
  }

  &__desc {

  }
}

</style>
