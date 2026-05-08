<template>
  <span class="environment-badge" :data-environment="normalizedEnvironment">
    {{ normalizedEnvironment }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import type { EnvironmentBadgeProps } from './EnvironmentBadge.model'

const props = defineProps<EnvironmentBadgeProps>()

const normalizedEnvironment = computed(() => props.environment || 'dev')
</script>

<style lang="scss" scoped>
.environment-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--pietru-color-border);
  background: var(--pietru-color-panel);
  color: var(--pietru-color-text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &[data-environment='prod'] {
    color: var(--pietru-color-success);
    border-color: color-mix(in srgb, var(--pietru-color-success) 35%, white);
    background: color-mix(in srgb, var(--pietru-color-success) 10%, white);
  }

  &[data-environment='preview'] {
    color: var(--pietru-color-warning);
    border-color: color-mix(in srgb, var(--pietru-color-warning) 35%, white);
    background: color-mix(in srgb, var(--pietru-color-warning) 10%, white);
  }

  &[data-environment='dev'] {
    color: var(--pietru-color-accent);
    border-color: color-mix(in srgb, var(--pietru-color-accent) 30%, white);
    background: var(--pietru-color-accent-soft);
  }
}
</style>
