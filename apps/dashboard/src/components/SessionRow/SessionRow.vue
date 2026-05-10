<template>
  <li class="session-row">
    <div>
      <strong>{{ session.user_agent || $t('sessionRow.unknownSession') }}</strong>
      <p>{{ formatTimestamp(session.created_at) }} {{ $t('sessionRow.to') }} {{ formatTimestamp(session.expires_at) }}</p>
    </div>
    <button type="button" @click="$emit('revoke', session.id)">{{ $t('sessionRow.buttonRevoke') }}</button>
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
    border: 1px solid color-mix(in srgb, var(--pietru-color-danger) 45%, var(--pietru-color-border));
    border-radius: var(--pietru-radius-sm);
    background: color-mix(in srgb, var(--pietru-color-danger) 10%, transparent);
    color: var(--pietru-color-danger);
  }
}
</style>
