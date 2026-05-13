<script setup lang="ts">
import { useBemm } from 'bemm'
import { Icon, Card } from '@sil/ui'

defineProps<{
  feature: {
    key: string
    title: string
    summary: string
    detail: string
    quickRef: string[]
    icon: string
  }
}>()

const detailBemm = useBemm('feature-detail', { return: 'string' })
const itemBemm = useBemm('feature-item', { return: 'string' })
</script>

<template>
  <Card :class="detailBemm()" variant="default" hoverable no-padding>
    <template #header>
      <div :class="detailBemm('header')">
        <div :class="itemBemm('icon')">
          <Icon :name="feature.icon" size="medium" color="primary" />
        </div>
      </div>
    </template>
    <div :class="detailBemm('body')">
      <h2 :class="detailBemm('title')">{{ feature.title }}</h2>
      <p :class="detailBemm('summary')">{{ feature.summary }}</p>
      <p :class="detailBemm('detail')">{{ feature.detail }}</p>
      <ul :class="detailBemm('list')">
        <li v-for="(item, itemIndex) in feature.quickRef" :key="itemIndex">
          {{ item }}
        </li>
      </ul>
    </div>
  </Card>
</template>

<style lang="scss">
.features-page {
  .feature-detail__header {
    padding: 1.5rem 1.5rem 0;
  }

  .feature-detail__body {
    padding: 0 1.5rem 1.5rem;
  }
}
</style>
