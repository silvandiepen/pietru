<script setup lang="ts">
import { useBemm } from 'bemm'
import { Card, Icon } from '@sil/ui'

defineProps<{
  items: Array<{
    title: string
    desc: string
    icon: string
  }>
}>()

const gridBemm = useBemm('principles-grid', { return: 'string' })
const principleBemm = useBemm('principle', { return: 'string' })
</script>

<template>
  <div :class="gridBemm()">
    <Card v-for="(item, index) in items" :key="index" :class="principleBemm()" variant="default" hoverable>
      <div :class="principleBemm('icon')">
        <Icon :name="item.icon" size="medium" color="primary" />
      </div>
      <h2 :class="principleBemm('title')">{{ item.title }}</h2>
      <p :class="principleBemm('desc')">{{ item.desc }}</p>
    </Card>
  </div>
</template>

<style lang="scss">
.about-page {
  .principles-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;

    .card {
      padding: 1.5rem;
    }
  }

  .principle__icon {
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

  .card:hover .principle__icon {
    transform: scale(1.08);
  }

  .principle__title {
    margin: 0 0 0.4rem;
    color: var(--pietru-navy);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .principle__desc {
    margin: 0;
    color: var(--pietru-muted);
    font-size: 0.9rem;
    line-height: 1.7;
  }
}

@media (max-width: 44em) {
  .about-page .principles-grid {
    grid-template-columns: 1fr;
  }
}
</style>
