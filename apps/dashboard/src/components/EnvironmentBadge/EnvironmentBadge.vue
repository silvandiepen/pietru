<template>
  <span class="environment-badge" :data-environment="normalizedEnvironment">
    {{ normalizedEnvironment }}
  </span>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'lezu-i18n/vue'

import type { EnvironmentBadgeProps } from './EnvironmentBadge.model'

const props = defineProps<EnvironmentBadgeProps>()
const { t } = useI18n()

const normalizedEnvironment = computed(() => props.environment || t('environmentBadge.fallback'))
</script>

<style lang="scss" scoped>
.environment-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--pietru-color-border);
  background: var(--pietru-color-surface);
  color: var(--pietru-color-text-muted);
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;

  &[data-environment='production'] {
    color: var(--pietru-color-success);
    border-color: color-mix(in srgb, var(--pietru-color-success) 22%, var(--pietru-color-border));
    background: color-mix(in srgb, var(--pietru-color-success) 8%, var(--pietru-color-surface));
  }

  &[data-environment='preview'] {
    color: var(--pietru-color-accent);
    border-color: color-mix(in srgb, var(--pietru-color-accent) 22%, var(--pietru-color-border));
    background: color-mix(in srgb, var(--pietru-color-accent) 8%, var(--pietru-color-surface));
  }

  &[data-environment='development'] {
    color: var(--pietru-color-warning);
    border-color: color-mix(in srgb, var(--pietru-color-warning) 22%, var(--pietru-color-border));
    background: color-mix(in srgb, var(--pietru-color-warning) 8%, var(--pietru-color-surface));
  }
}
</style>
