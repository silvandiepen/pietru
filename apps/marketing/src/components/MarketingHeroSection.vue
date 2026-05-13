<script setup lang="ts">
import { useBemm } from 'bemm'
import { Button } from '@sil/ui'

defineProps<{
  title: string
  summary: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel: string
  secondaryTo: string
}>()

const bemm = useBemm('hero', { return: 'string' })
const titleBemm = useBemm('marketing-title', { return: 'string' })
const subtitleBemm = useBemm('marketing-subtitle', { return: 'string' })
const actionsBemm = useBemm('marketing-actions', { return: 'string' })
</script>

<template>
  <div :class="bemm()">
    <div :class="bemm('inner')">
      <div :class="bemm('panel')" />

      <div :class="bemm('content')">
        <h1 :class="[titleBemm(), titleBemm('', 'hero')]">
          {{ title }}
        </h1>
        <p :class="subtitleBemm()" style="margin-inline: 0;">{{ summary }}</p>
        <div :class="actionsBemm()" style="justify-content: flex-start;">
          <Button variant="primary" :href="primaryHref" target="_blank">
            {{ primaryLabel }}
          </Button>
          <Button variant="ghost" :to="secondaryTo">
            {{ secondaryLabel }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
