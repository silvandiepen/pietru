<script setup lang="ts">
import { useBemm } from 'bemm'
import { Icon } from '@sil/ui'

defineProps<{
  features: Array<{
    key: string
    title: string
    desc: string
    icon: string
  }>
}>()

const gridBemm = useBemm('feature-grid', { return: 'string' })
const itemBemm = useBemm('feature-item', { return: 'string' })
</script>

<template>
  <div :class="gridBemm()">
    <article v-for="feature in features" :key="feature.key" :class="itemBemm()">
      <div :class="itemBemm('icon')">
        <Icon :name="feature.icon" size="medium" color="primary" />
      </div>
      <h3 :class="itemBemm('title')">{{ feature.title }}</h3>
      <p :class="itemBemm('desc')">{{ feature.desc }}</p>
    </article>
  </div>
</template>
