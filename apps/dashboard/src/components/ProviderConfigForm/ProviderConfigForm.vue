<template>
  <form class="provider-config-form" @submit.prevent="submit">
    <label>
      <span>{{ $t('providerConfig.labelProvider') }}</span>
      <select v-model="form.providerType">
        <option value="resend">{{ $t('providerConfig.optionResend') }}</option>
        <option value="ses">{{ $t('providerConfig.optionSes') }}</option>
      </select>
    </label>

    <!-- Resend fields -->
    <template v-if="form.providerType === 'resend'">
      <label>
        <span>{{ $t('providerConfig.labelApiKey') }}</span>
        <input v-model="apiKey" type="password" :placeholder="$t('providerConfig.placeholderResendKey')" />
      </label>
    </template>

    <!-- SES fields -->
    <template v-if="form.providerType === 'ses'">
      <label>
        <span>{{ $t('providerConfig.labelRegion') }}</span>
        <select v-model="sesRegion">
          <option value="">Select region</option>
          <option v-for="region in sesRegions" :key="region.value" :value="region.value">
            {{ region.label }}
          </option>
        </select>
      </label>
      <label>
        <span>{{ $t('providerConfig.labelAccessKeyId') }}</span>
        <input v-model="sesAccessKeyId" type="text" :placeholder="$t('providerConfig.placeholderAccessKeyId')" />
      </label>
      <label>
        <span>{{ $t('providerConfig.labelSecretAccessKey') }}</span>
        <input v-model="sesSecretAccessKey" type="password" :placeholder="$t('providerConfig.placeholderSecretAccessKey')" />
      </label>
    </template>

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

// Resend
const apiKey = ref('')

// SES
const sesRegion = ref('')
const sesAccessKeyId = ref('')
const sesSecretAccessKey = ref('')

const allowedDomainsInput = ref((props.initialValue?.allowedDomains || []).join(', '))

const sesRegions = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'EU (Ireland)' },
  { value: 'eu-west-2', label: 'EU (London)' },
  { value: 'eu-central-1', label: 'EU (Frankfurt)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
]

function submit() {
  let config: Record<string, unknown>

  if (form.providerType === 'ses') {
    config = {
      region: sesRegion.value,
      accessKeyId: sesAccessKeyId.value,
      secretAccessKey: sesSecretAccessKey.value,
    }
  } else {
    config = { apiKey: apiKey.value }
  }

  emit('submit', {
    ...form,
    config,
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
