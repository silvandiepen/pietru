<script setup lang="ts">
import { useBemm } from 'bemm'
import { Button, Colors, Section } from '@sil/ui'

withDefaults(
  defineProps<{
    title: string
    summary?: string
    buttonLabel: string
    href: string
  }>(),
  {
    summary: '',
  },
)

const sectionBemm = useBemm('marketing-section', { return: 'string' })
const ctaBemm = useBemm('marketing-cta-section', { return: 'string' })
const titleBemm = useBemm('marketing-title', { return: 'string' })
const subtitleBemm = useBemm('marketing-subtitle', { return: 'string' })
const actionsBemm = useBemm('marketing-actions', { return: 'string' })
</script>

<template>
  <Section variant="cta" centered :class="[sectionBemm(), ctaBemm()]">
    <h2 :class="titleBemm()">{{ title }}</h2>
    <p v-if="summary" :class="subtitleBemm()">{{ summary }}</p>
    <div :class="actionsBemm()">
      <Button variant="default" :color="Colors.DARK" :href="href" target="_blank">
        {{ buttonLabel }}
      </Button>
    </div>
  </Section>
</template>
