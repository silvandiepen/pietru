<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Button, Colors } from '@sil/ui'

defineProps<{
  plans: Array<{
    key: string
    name: string
    price: string
    period: string
    description: string
    features: string[]
    cta: string
  }>
  popularLabel: string
  dashboardUrl: string
}>()

const gridBemm = useBemm('plans-grid', { return: 'string' })
const planBemm = useBemm('plan', { return: 'string' })
</script>

<template>
  <div :class="gridBemm()">
    <article
      v-for="plan in plans"
      :key="plan.key"
      :class="[planBemm(), planBemm('', { highlight: plan.key === 'pro' })]"
    >
      <h2 :class="planBemm('name')">
        {{ plan.name }}
        <Badge v-if="plan.key === 'pro'" variant="default" size="small">
          {{ popularLabel }}
        </Badge>
      </h2>
      <div :class="planBemm('price')">
        <span :class="planBemm('amount')">{{ plan.price }}</span>
        <span :class="planBemm('period')">/ {{ plan.period }}</span>
      </div>
      <p :class="planBemm('desc')">{{ plan.description }}</p>
      <ul :class="planBemm('features')">
        <li v-for="(feature, index) in plan.features" :key="index">
          {{ feature }}
        </li>
      </ul>
      <Button
        :class="planBemm('cta')"
        :variant="plan.key === 'pro' ? 'default' : 'outline'"
        :color="plan.key === 'pro' ? Colors.DARK : Colors.LIGHT"
        :href="dashboardUrl"
        target="_blank"
      >
        {{ plan.cta }}
      </Button>
    </article>
  </div>
</template>

<style lang="scss">
.pricing-page {
  .plans-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    max-width: 44rem;
  }

  .plan__cta {
    width: fit-content;
    margin-top: auto;
  }
}

@media (max-width: 44em) {
  .pricing-page .plans-grid {
    grid-template-columns: 1fr;
  }
}
</style>
