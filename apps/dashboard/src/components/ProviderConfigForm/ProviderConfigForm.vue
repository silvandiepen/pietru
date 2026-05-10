<template>
  <form class="provider-config-form" @submit.prevent="submit">
    <label>
      <span>{{ $t('providerConfig.labelProvider') }}</span>
      <select v-model="form.providerType">
        <option value="resend">{{ $t('providerConfig.optionResend') }}</option>
      </select>
    </label>
    <label>
      <span>{{ $t('providerConfig.labelApiKey') }}</span>
      <input v-model="apiKey" type="password" :placeholder="$t('providerConfig.placeholderApiKey')" />
    </label>
    <label>
      <span>{{ $t('providerConfig.labelDefaultFrom') }}</span>
      <input v-model="form.defaultFrom" type="email" :placeholder="$t('providerConfig.placeholderDefaultFrom')" />
    </label>
    <label>
      <span>{{ $t('providerConfig.labelAllowedDomains') }}</span>
      <input v-model="allowedDomainsInput" type="text" :placeholder="$t('providerConfig.placeholderAllowedDomains')" />
    </label>
    <label>
      <span>{{ $t('providerConfig.labelMode') }}</span>
      <select v-model="form.mode">
        <option value="send">{{ $t('providerConfig.modeSend') }}</option>
        <option value="capture">{{ $t('providerConfig.modeCapture') }}</option>
        <option value="send_and_capture">{{ $t('providerConfig.modeSendAndCapture') }}</option>
      </select>
    </label>
    <label>
      <span>{{ $t('providerConfig.labelEnvironment') }}</span>
      <select v-model="form.environment">
        <option value="development">{{ $t('providerConfig.optionDevelopment') }}</option>
        <option value="preview">{{ $t('providerConfig.optionPreview') }}</option>
        <option value="production">{{ $t('providerConfig.optionProduction') }}</option>
      </select>
    </label>
    <button type="submit" :disabled="pending">{{ $t('providerConfig.buttonSave') }}</button>
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
  mode: props.initialValue?.mode || 'send',
  environment: props.initialValue?.environment || 'development',
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
