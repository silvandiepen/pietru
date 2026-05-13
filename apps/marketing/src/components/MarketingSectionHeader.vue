<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge } from '@sil/ui'

withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    centered?: boolean
    heroTitle?: boolean
    badgeVariant?: 'default' | 'primary' | 'outline'
  }>(),
  {
    eyebrow: '',
    title: '',
    subtitle: '',
    centered: false,
    heroTitle: false,
    badgeVariant: 'primary',
  },
)

const headerBemm = useBemm('marketing-header', { return: 'string' })
const titleBemm = useBemm('marketing-title', { return: 'string' })
const subtitleBemm = useBemm('marketing-subtitle', { return: 'string' })
</script>

<template>
  <div :class="[headerBemm(), headerBemm('', { center: centered })]">
    <Badge v-if="eyebrow" :variant="badgeVariant" size="small">{{ eyebrow }}</Badge>
    <h1 v-if="title && heroTitle" :class="[titleBemm(), titleBemm('', 'hero')]" style="margin-top: 0.75rem;">
      {{ title }}
    </h1>
    <h2 v-else-if="title" :class="titleBemm()" style="margin-top: 0.75rem;">{{ title }}</h2>
    <p v-if="subtitle" :class="subtitleBemm()">{{ subtitle }}</p>
  </div>
</template>
