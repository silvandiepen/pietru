<template>
  <div v-if="open" class="api-key-dialog">
    <div class="api-key-dialog__backdrop" @click="$emit('close')"></div>
    <div class="api-key-dialog__panel">
      <header class="api-key-dialog__header">
        <h3>Create API key</h3>
        <button type="button" @click="$emit('close')">Close</button>
      </header>

      <div v-if="revealedKey" class="api-key-dialog__revealed">
        <p>Copy this key now. It will only be shown once.</p>
        <code>{{ revealedKey }}</code>
      </div>

      <form v-else class="api-key-dialog__form" @submit.prevent="submit">
        <label>
          <span>Name</span>
          <input v-model="form.name" type="text" placeholder="Backend worker" />
        </label>
        <label>
          <span>Environment</span>
          <select v-model="form.environment">
            <option value="dev">dev</option>
            <option value="preview">preview</option>
            <option value="prod">prod</option>
          </select>
        </label>
        <button type="submit" :disabled="pending">Create key</button>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

import type {
  ApiKeyCreateDialogProps,
  ApiKeyCreateDialogSubmitPayload,
} from './ApiKeyCreateDialog.model'

defineProps<ApiKeyCreateDialogProps>()

const emit = defineEmits<{
  close: []
  submit: [payload: ApiKeyCreateDialogSubmitPayload]
}>()

const form = reactive<ApiKeyCreateDialogSubmitPayload>({
  name: '',
  environment: 'dev',
})

function submit() {
  emit('submit', { ...form })
}
</script>

<style lang="scss" scoped>
.api-key-dialog {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  z-index: 20;

  &__backdrop {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
  }

  &__panel {
    position: relative;
    z-index: 1;
    width: min(30rem, calc(100vw - 2rem));
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);
  }

  &__header,
  &__form {
    display: grid;
    gap: 1rem;
  }

  &__header {
    grid-template-columns: 1fr auto;
    align-items: center;
  }

  &__revealed code {
    display: block;
    margin-top: 0.75rem;
    padding: 0.9rem;
    border-radius: var(--pietru-radius-sm);
    background: #0f172a;
    color: #f8fafc;
    font-family: var(--pietru-font-family-mono);
    word-break: break-all;
  }

  label {
    display: grid;
    gap: 0.4rem;
  }

  input,
  select,
  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
  }

  button[type='submit'] {
    background: var(--pietru-color-accent);
    color: white;
    border-color: var(--pietru-color-accent);
  }
}
</style>
