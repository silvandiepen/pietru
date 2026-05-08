<template>
  <tr class="message-row" @click="$emit('select', message.id)">
    <td class="message-row__status">
      <span class="message-row__dot" :data-status="message.status"></span>
      {{ message.status }}
    </td>
    <td>{{ message.toAddress }}</td>
    <td>{{ message.fromAddress }}</td>
    <td>{{ message.subject }}</td>
    <td>{{ formatTimestamp(message.sentAt || message.createdAt) }}</td>
  </tr>
</template>

<script lang="ts" setup>
import type { MessageRowProps } from './MessageRow.model'

defineProps<MessageRowProps>()

defineEmits<{
  select: [messageId: string]
}>()

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<style lang="scss" scoped>
.message-row {
  cursor: pointer;
  transition: background-color 160ms ease;

  &:hover {
    background: color-mix(in srgb, var(--pietru-color-text) 4%, var(--pietru-color-surface));
  }

  td {
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--pietru-color-panel-strong);
    vertical-align: middle;
  }

  &__status {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    text-transform: capitalize;
  }

  &__dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--pietru-color-text-muted);
    box-shadow: 0 0 0 0.2rem color-mix(in srgb, currentColor 16%, transparent);

    &[data-status='sent'],
    &[data-status='delivered'] {
      background: var(--pietru-color-success);
    }

    &[data-status='queued'],
    &[data-status='processing'] {
      background: var(--pietru-color-warning);
    }

    &[data-status='failed'] {
      background: var(--pietru-color-danger);
    }
  }
}
</style>
