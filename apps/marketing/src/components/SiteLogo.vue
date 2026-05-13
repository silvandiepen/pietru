<script setup lang="ts">
import { useBemm } from 'bemm'

import icon from '@/assets/logo-icon-noborder.svg?raw'
import logo from '@/assets/logo-wordmark.svg?raw'

withDefaults(
  defineProps<{
    showIcon?: boolean
  }>(),
  {
    showIcon: false,
  },
)

const bemm = useBemm('pietru-logo', { includeBaseClass: true })
</script>

<template>
  <span :class="bemm()">
    <span v-if="showIcon" :class="bemm('icon')" v-html="icon" />
    <span :class="bemm('wordmark')" v-html="logo" />
  </span>
</template>
