<script setup lang="ts">
import { useBemm } from 'bemm'
import { Badge, Button, Colors, Section } from '@sil/ui'

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

const bemm = useBemm('pricing-plans', { includeBaseClass: true })
</script>

<template>
  <Section :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('grid')">
        <article
          v-for="plan in plans"
          :key="plan.key"
          :class="bemm('plan', { highlight: plan.key === 'pro' })"
        >
          <h2 :class="bemm('name')">
            {{ plan.name }}
            <Badge v-if="plan.key === 'pro'" variant="default" size="small">
              {{ popularLabel }}
            </Badge>
          </h2>
          <div :class="bemm('price')">
            <span :class="bemm('amount')">{{ plan.price }}</span>
            <span :class="bemm('period')">/ {{ plan.period }}</span>
          </div>
          <p :class="bemm('desc')">{{ plan.description }}</p>
          <ul :class="bemm('features')">
            <li v-for="(feature, index) in plan.features" :key="index">
              {{ feature }}
            </li>
          </ul>
          <Button
            :class="bemm('cta')"
            :variant="plan.key === 'pro' ? 'default' : 'outline'"
            :color="plan.key === 'pro' ? Colors.DARK : Colors.LIGHT"
            :href="dashboardUrl"
            target="_blank"
          >
            {{ plan.cta }}
          </Button>
        </article>
      </div>
    </div>
  </Section>
</template>

<style lang="scss">
.pricing-plans {
  position: relative;
  min-height: 0 !important;
  padding-block: 0 5.5rem;
  background: var(--color-primary);
  color: var(--color-background);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
      color-mix(in srgb, var(--color-background) 8%, transparent) 1px,
      transparent 1px
    );
    background-size: 24px 24px;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &__content {
    max-width: var(--marketing-wrap);
    margin-inline: auto;
    padding-inline: 2rem;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.5rem;
    max-width: 44rem;
    margin-inline: auto;
  }

  &__plan {
    display: flex;
    min-width: 0;
    flex-direction: column;
    border: 1px solid color-mix(in srgb, var(--color-background) 14%, transparent);
    border-radius: 0.75rem;
    background: transparent;
    box-shadow: none;
    padding: 1.75rem;
    transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(255, 59, 31, 0.08);
    }

    &--highlight {
      border-color: var(--color-primary-accent, #FF3B1F);
      background: var(--color-primary-accent, #FF3B1F);
      box-shadow: var(--glow-primary);

      &:hover {
        box-shadow: 0 0 80px -12px rgba(255, 59, 31, 0.35);
      }
    }
  }

  &__name {
    margin: 0 0 0.75rem;
    color: var(--color-primary-accent, #FF3B1F);
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 2px;
    line-height: 1.3;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  &__price {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-items: baseline;
    margin-bottom: 0.75rem;
  }

  &__amount {
    color: var(--color-background);
    font-size: 2rem;
    font-weight: 800;
    line-height: 1;
  }

  &__plan--highlight &__amount {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  }

  &__period {
    color: color-mix(in srgb, var(--color-background) 55%, transparent);
    font-size: 0.85rem;
  }

  &__desc {
    margin: 0 0 1.25rem;
    color: color-mix(in srgb, var(--color-background) 65%, transparent);
    font-size: 0.9rem;
    line-height: 1.7;
  }

  &__features {
    display: grid;
    gap: 0.5rem;
    margin: 0 0 1.5rem;
    padding: 0;
    list-style: none;

    li {
      position: relative;
      padding-left: 1.25rem;
      color: color-mix(in srgb, var(--color-background) 75%, transparent);
      font-size: 0.9rem;
      line-height: 1.55;

      &::before {
        position: absolute;
        top: 0.56em;
        left: 0;
        content: '\2713';
        font-size: 0.75rem;
        color: var(--color-primary-accent, #FF3B1F);
      }
    }
  }

  &__cta {
    width: fit-content;
    margin-top: auto;
  }
}

@media (max-width: 44em) {
  .pricing-plans {
    &__grid {
      grid-template-columns: 1fr;
    }
  }
}

@media (max-width: 30em) {
  .pricing-plans {
    &__content {
      padding-inline: 1.25rem;
    }
  }
}
</style>
