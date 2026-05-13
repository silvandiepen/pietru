<script setup lang="ts">
import { useBemm } from 'bemm'
import { Collapsible } from '@sil/ui'

defineProps<{
  items: Array<{ q: string; a: string }>
}>()

const bemm = useBemm('faq', { return: 'string' })
</script>

<template>
  <div :class="bemm()">
    <Collapsible v-for="(item, index) in items" :key="index" :label="item.q">
      <p :class="bemm('answer')">{{ item.a }}</p>
    </Collapsible>
  </div>
</template>
