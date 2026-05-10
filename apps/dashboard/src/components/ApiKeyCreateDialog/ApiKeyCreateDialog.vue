<template>
  <div v-if="open" class="api-key-dialog">
    <div class="api-key-dialog__backdrop" @click="$emit('close')"></div>
    <div class="api-key-dialog__panel">
      <header class="api-key-dialog__header">
        <h3>{{ $t('apiKeyDialog.title') }}</h3>
        <button type="button" @click="$emit('close')">{{ $t('apiKeyDialog.buttonClose') }}</button>
      </header>

      <div v-if="revealedKey" class="api-key-dialog__revealed">
        <p>{{ $t('apiKeyDialog.copyWarning') }}</p>
        <code>{{ revealedKey }}</code>
      </div>

      <form v-else class="api-key-dialog__form" @submit.prevent="submit">
        <label>
          <span>{{ $t('apiKeyDialog.labelName') }}</span>
          <input v-model="form.name" type="text" :placeholder="$t('apiKeyDialog.placeholderName')" />
        </label>
        <label>
          <span>{{ $t('apiKeyDialog.labelEnvironment') }}</span>
          <select v-model="form.environment">
            <option value="development">{{ $t('apiKeyDialog.optionDevelopment') }}</option>
            <option value="preview">{{ $t('apiKeyDialog.optionPreview') }}</option>
            <option value="production">{{ $t('apiKeyDialog.optionProduction') }}</option>
          </select>
        </label>
        <button type="submit" :disabled="pending">{{ $t('apiKeyDialog.buttonCreateKey') }}</button>
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
  environment: 'development',
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
    background: color-mix(in srgb, var(--pietru-color-background) 72%, transparent);
  }

  &__panel {
    position: relative;
    z-index: 1;
    width: min(30rem, calc(100vw - 2rem));
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-surface);
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

    h3 {
      margin: 0;
      font-weight: 600;
    }
  }

  &__revealed code {
    display: block;
    margin-top: 0.75rem;
    padding: 0.9rem;
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
    font-family: var(--pietru-font-family-mono);
    word-break: break-all;
  }

  label {
    display: grid;
    gap: 0.4rem;
    color: var(--pietru-color-text-muted);
  }

  input,
  select,
  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
  }

  input,
  select {
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);

    &:focus {
      outline: none;
      border-color: var(--pietru-color-accent);
    }
  }

  button {
    background: transparent;
    color: var(--pietru-color-text);
  }

  button[type='submit'] {
    background: var(--pietru-color-accent);
    color: var(--pietru-color-background);
    border-color: var(--pietru-color-accent);
    font-weight: 500;
  }
}
</style>
