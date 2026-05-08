<template>
  <li class="session-row">
    <div>
      <strong>{{ session.userAgent || 'Unknown session' }}</strong>
      <p>{{ formatTimestamp(session.createdAt) }} to {{ formatTimestamp(session.expiresAt) }}</p>
    </div>
    <button type="button" @click="$emit('revoke', session.id)">Revoke</button>
  </li>
</template>

<script lang="ts" setup>
import type { SessionRowProps } from './SessionRow.model'

defineProps<SessionRowProps>()

defineEmits<{
  revoke: [sessionId: string]
}>()

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<style lang="scss" scoped>
.session-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--pietru-color-border);
  border-radius: var(--pietru-radius-md);
  background: var(--pietru-color-panel);

  p {
    margin: 0.35rem 0 0;
    color: var(--pietru-color-text-muted);
  }

  button {
    padding: 0.65rem 0.9rem;
    border: 1px solid var(--pietru-color-danger);
    border-radius: var(--pietru-radius-sm);
    background: white;
    color: var(--pietru-color-danger);
  }
}
</style>
