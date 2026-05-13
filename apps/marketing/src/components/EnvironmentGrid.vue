<script setup lang="ts">
import { useBemm } from 'bemm'
import { Icon } from '@sil/ui'

defineProps<{
  environments: Array<{
    key: string
    title: string
    desc: string
    icon: string
  }>
}>()

const gridBemm = useBemm('environment-grid', { return: 'string' })
const itemBemm = useBemm('environment-item', { return: 'string' })
</script>

<template>
  <div :class="gridBemm()">
    <article v-for="env in environments" :key="env.key" :class="itemBemm()">
      <div :class="itemBemm('icon')">
        <Icon :name="env.icon" size="medium" />
      </div>
      <h3 :class="itemBemm('title')">{{ env.title }}</h3>
      <p :class="itemBemm('desc')">{{ env.desc }}</p>
    </article>
  </div>
</template>
