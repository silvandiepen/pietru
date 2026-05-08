<template>
  <form class="provider-config-form" @submit.prevent="submit">
    <label>
      <span>Provider</span>
      <select v-model="form.providerType">
        <option value="resend">Resend</option>
      </select>
    </label>
    <label>
      <span>API key</span>
      <input v-model="apiKey" type="password" placeholder="re_xxx" />
    </label>
    <label>
      <span>Default from</span>
      <input v-model="form.defaultFrom" type="email" placeholder="noreply@example.com" />
    </label>
    <label>
      <span>Allowed domains</span>
      <input v-model="allowedDomainsInput" type="text" placeholder="example.com, app.example.com" />
    </label>
    <label>
      <span>Mode</span>
      <select v-model="form.mode">
        <option value="live">live</option>
        <option value="capture">capture</option>
      </select>
    </label>
    <label>
      <span>Environment</span>
      <select v-model="form.environment">
        <option value="dev">dev</option>
        <option value="preview">preview</option>
        <option value="prod">prod</option>
      </select>
    </label>
    <button type="submit" :disabled="pending">Save provider config</button>
  </form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { ProviderConfigPayload } from '@/stores/providers.model'

import type { ProviderConfigFormProps } from './ProviderConfigForm.model'

const props = defineProps<ProviderConfigFormProps>()

const emit = defineEmits<{
  submit: [payload: ProviderConfigPayload]
}>()

const form = reactive<ProviderConfigPayload>({
  providerType: props.initialValue?.providerType || 'resend',
  config: props.initialValue?.config || {},
  mode: props.initialValue?.mode || 'live',
  environment: props.initialValue?.environment || 'dev',
  defaultFrom: props.initialValue?.defaultFrom || '',
  allowedDomains: props.initialValue?.allowedDomains || [],
})

const apiKey = ref('')
const allowedDomainsInput = ref((props.initialValue?.allowedDomains || []).join(', '))

function submit() {
  emit('submit', {
    ...form,
    config: {
      apiKey: apiKey.value,
    },
    allowedDomains: allowedDomainsInput.value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  })
}
</script>

<style lang="scss" scoped>
.provider-config-form {
  display: grid;
  gap: 1rem;

  label {
    display: grid;
    gap: 0.45rem;
    color: var(--pietru-color-text-muted);
  }

  input,
  select,
  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
  }

  input,
  select {
    &:focus {
      outline: none;
      border-color: var(--pietru-color-accent);
    }
  }

  button {
    background: var(--pietru-color-accent);
    color: var(--pietru-color-background);
    border-color: var(--pietru-color-accent);
    font-weight: 500;
  }
}
</style>
