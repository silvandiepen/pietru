<template>
  <AppLayout
    :project-name="project?.name || t('projectDetail.fallbackTitle')"
    :environment="project?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="project-detail-view">
      <header class="project-detail-view__header">
        <div>
          <h2>{{ project?.name || t('projectDetail.fallbackTitle') }}</h2>
          <p>{{ project?.slug }}</p>
        </div>
        <button type="button" @click="dialogOpen = true">{{ $t('projectDetail.buttonCreateApiKey') }}</button>
      </header>

      <div class="project-detail-view__tabs">
        <button
          v-for="tabOption in tabs"
          :key="tabOption.key"
          type="button"
          :data-active="tab === tabOption.key"
          @click="tab = tabOption.key"
        >
          {{ tabOption.label }}
        </button>
      </div>

      <section v-if="tab === 'environments'" class="project-detail-view__panel">
        <h3>{{ $t('projectDetail.headingEnvironments') }}</h3>
        <div class="project-detail-view__environments">
          <EnvironmentBadge environment="dev" />
          <EnvironmentBadge environment="preview" />
          <EnvironmentBadge environment="prod" />
        </div>
      </section>

      <section v-if="tab === 'api keys'" class="project-detail-view__panel">
        <h3>{{ $t('projectDetail.headingApiKeys') }}</h3>
        <ul class="project-detail-view__list">
          <li v-for="apiKey in apiKeys" :key="apiKey.id">
            <div>
              <strong>{{ apiKey.name || apiKey.key_prefix }}</strong>
              <p>{{ apiKey.environment }} · {{ apiKey.key_prefix }}</p>
            </div>
            <button type="button" @click="revokeApiKey(apiKey.id)">{{ $t('projectDetail.buttonRevoke') }}</button>
          </li>
        </ul>
      </section>

      <section v-if="tab === 'provider config'" class="project-detail-view__panel">
        <h3>{{ $t('projectDetail.headingProviderConfig') }}</h3>
        <ProviderConfigForm @submit="createProviderConfig" />
        <ul class="project-detail-view__list">
          <li v-for="config in providerConfigs" :key="config.id">
            <div>
              <strong>{{ config.provider_type }}</strong>
              <p>{{ config.environment }} · {{ config.mode }} · {{ config.default_from }}</p>
            </div>
            <button type="button" @click="validateProviderConfig(config.id)">{{ $t('projectDetail.buttonValidate') }}</button>
          </li>
        </ul>
        <p v-if="providerValidationMessage">{{ providerValidationMessage }}</p>
      </section>

      <section v-if="tab === 'hooks'" class="project-detail-view__panel">
        <h3>Email Hooks</h3>
        <form class="project-detail-view__hook-form" @submit.prevent="createHook">
          <input v-model="hookForm.name" type="text" placeholder="Hook name" required />
          <select v-model="hookForm.filter_type" required>
            <option value="any">Any</option>
            <option value="tag">Tag</option>
            <option value="from_domain">From domain</option>
            <option value="subject_regex">Subject regex</option>
          </select>
          <input
            v-model="hookForm.filter_value"
            type="text"
            placeholder="Filter value"
            :disabled="hookForm.filter_type === 'any'"
          />
          <input v-model="hookForm.webhook_url" type="url" placeholder="Webhook URL" required />
          <label class="project-detail-view__hook-active">
            <input v-model="hookForm.is_active" type="checkbox" />
            Active
          </label>
          <button type="submit">Create Hook</button>
        </form>

        <ul class="project-detail-view__list">
          <li v-for="hook in emailHooks" :key="hook.id">
            <div>
              <strong>{{ hook.name }}</strong>
              <p>
                {{ hook.filter_type }}{{ hook.filter_value ? `: ${hook.filter_value}` : '' }}
                · {{ hook.webhook_url }}
              </p>
            </div>
            <div class="project-detail-view__hook-actions">
              <button
                type="button"
                :data-active="hook.is_active"
                @click="toggleHook(hook.id)"
              >
                {{ hook.is_active ? 'Enabled' : 'Disabled' }}
              </button>
              <button type="button" @click="deleteHook(hook.id)">Delete</button>
            </div>
          </li>
        </ul>
      </section>

      <section v-if="tab === 'domains'" class="project-detail-view__panel">
        <h3>{{ $t('projectDetail.headingDomains') }}</h3>
        <p class="project-detail-view__domains-desc">{{ $t('projectDetail.domainsDescription') }}</p>

        <form class="project-detail-view__domain-form" @submit.prevent="addDomain">
          <input
            v-model="newDomain"
            type="text"
            placeholder="example.com"
            required
          />
          <button type="submit" :disabled="domainStore.loading">{{ $t('projectDetail.buttonAddDomain') }}</button>
        </form>

        <p v-if="domainStore.error" class="project-detail-view__error">{{ domainStore.error }}</p>

        <ul v-if="domainStore.items.length" class="project-detail-view__list">
          <li v-for="dv in domainStore.items" :key="dv.id">
            <div>
              <strong>{{ dv.domain }}</strong>
              <p>
                <span :class="`domain-status domain-status--${(dv.verification_status || '').toLowerCase()}`">
                  {{ $t(`projectDetail.domainStatus${dv.verification_status || 'PENDING'}`) }}
                </span>
                ·
                <span :class="`domain-status domain-status--${(dv.dkim_status || '').toLowerCase()}`">
                  DKIM: {{ $t(`projectDetail.domainStatus${dv.dkim_status || 'PENDING'}`) }}
                </span>
              </p>
            </div>
            <div class="project-detail-view__hook-actions">
              <button type="button" @click="refreshDomain(dv.id)">{{ $t('projectDetail.buttonRefreshDomain') }}</button>
              <button type="button" @click="removeDomain(dv.id)">{{ $t('projectDetail.buttonRemoveDomain') }}</button>
            </div>

            <!-- DNS records panel -->
            <div v-if="dv.dkim_tokens && dv.dkim_tokens.length" class="project-detail-view__dns-records">
              <h4>{{ $t('projectDetail.headingDnsRecords') }}</h4>
              <p>{{ $t('projectDetail.dnsRecordsDescription', { domain: dv.domain }) }}</p>
              <div class="project-detail-view__dns-record">
                <label>Type: TXT</label>
                <code>_amazonses.{{ dv.domain }}</code>
                <code>{{ $t('projectDetail.dnsRecordValueHint') }}</code>
              </div>
              <div v-for="token in dv.dkim_tokens" :key="token" class="project-detail-view__dns-record">
                <label>Type: CNAME</label>
                <code>{{ token }}._domainkey.{{ dv.domain }}</code>
                <code>{{ token }}.dkim.amazonses.com</code>
              </div>
            </div>
          </li>
        </ul>

        <p v-else class="project-detail-view__empty">{{ $t('projectDetail.noDomains') }}</p>
      </section>

      <ApiKeyCreateDialog
        :open="dialogOpen"
        :revealed-key="apiKeysStore.lastCreatedKey?.key || null"
        @close="closeDialog"
        @submit="createApiKey"
      />
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'lezu-i18n/vue'

import ApiKeyCreateDialog from '@/components/ApiKeyCreateDialog'
import AppLayout from '@/components/AppLayout'
import EnvironmentBadge from '@/components/EnvironmentBadge'
import ProviderConfigForm from '@/components/ProviderConfigForm'
import { useApiKeysStore } from '@/stores/apiKeys'
import { useDomainVerificationsStore } from '@/stores/domainVerifications'
import { useEmailHooksStore } from '@/stores/emailHooks'
import { useProjectsStore } from '@/stores/projects'
import { useProvidersStore } from '@/stores/providers'
import type { ApiKeyCreateDialogSubmitPayload } from '@/components/ApiKeyCreateDialog/ApiKeyCreateDialog.model'
import type { ProviderConfigPayload } from '@/stores/providers.model'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()
const emailHooksStore = useEmailHooksStore()
const domainStore = useDomainVerificationsStore()
const { t } = useI18n()

const tabs = [
  { key: 'environments' as const, label: computed(() => t('projectDetail.tabEnvironments')) },
  { key: 'api keys' as const, label: computed(() => t('projectDetail.tabApiKeys')) },
  { key: 'provider config' as const, label: computed(() => t('projectDetail.tabProviderConfig')) },
  { key: 'hooks' as const, label: computed(() => 'Hooks') },
  { key: 'domains' as const, label: computed(() => t('projectDetail.tabDomains')) },
]
const tab = ref<(typeof tabs)[number]['key']>('environments')
const dialogOpen = ref(false)
const providerValidationMessage = ref('')
const newDomain = ref('')

const hookForm = reactive({
  name: '',
  filter_type: 'any' as 'tag' | 'from_domain' | 'subject_regex' | 'any',
  filter_value: '',
  webhook_url: '',
  is_active: true,
})

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectsStore.items.find((item) => item.id === projectId.value) || null)
const apiKeys = computed(() => apiKeysStore.items[projectId.value] || [])
const providerConfigs = computed(() => providersStore.items[projectId.value] || [])
const emailHooks = computed(() => emailHooksStore.items[projectId.value] || [])

onMounted(async () => {
  await Promise.all([
    projectsStore.list(),
    projectsStore.get(projectId.value),
    apiKeysStore.list(projectId.value),
    providersStore.list(projectId.value),
    emailHooksStore.list(projectId.value),
    domainStore.fetchAll(projectId.value),
  ])
  projectsStore.setActiveProject(projectId.value)
})

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}`)
}

async function createApiKey(payload: ApiKeyCreateDialogSubmitPayload) {
  await apiKeysStore.create(projectId.value, payload)
}

async function revokeApiKey(keyId: string) {
  await apiKeysStore.revoke(projectId.value, keyId)
}

async function createProviderConfig(payload: ProviderConfigPayload) {
  await providersStore.create(projectId.value, payload)
}

async function validateProviderConfig(configId: string) {
  const result = await providersStore.validate(projectId.value, configId)
  providerValidationMessage.value = result.valid ? t('projectDetail.validationValid') : result.message || t('projectDetail.validationFailed')
}

async function createHook() {
  await emailHooksStore.create(projectId.value, {
    name: hookForm.name,
    filter_type: hookForm.filter_type,
    filter_value: hookForm.filter_type === 'any' ? null : hookForm.filter_value || null,
    webhook_url: hookForm.webhook_url,
    is_active: hookForm.is_active,
  })
  hookForm.name = ''
  hookForm.filter_type = 'any'
  hookForm.filter_value = ''
  hookForm.webhook_url = ''
  hookForm.is_active = true
}

async function toggleHook(hookId: string) {
  await emailHooksStore.toggle(projectId.value, hookId)
}

async function deleteHook(hookId: string) {
  await emailHooksStore.delete(projectId.value, hookId)
}

async function addDomain() {
  if (!newDomain.value.trim()) return
  try {
    await domainStore.addDomain(projectId.value, newDomain.value.trim())
    newDomain.value = ''
  } catch {
    // error is shown via domainStore.error
  }
}

async function refreshDomain(domainId: string) {
  await domainStore.verifyDomain(projectId.value, domainId)
}

async function removeDomain(domainId: string) {
  await domainStore.removeDomain(projectId.value, domainId)
}

function closeDialog() {
  dialogOpen.value = false
  apiKeysStore.clearLastCreatedKey()
}
</script>

<style lang="scss" scoped>
.project-detail-view {
  display: grid;
  gap: 1.5rem;

  &__header,
  &__list li,
  &__environments {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  &__tabs {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;

    button {
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: transparent;
      color: var(--pietru-color-text-muted);

      &[data-active='true'] {
        border-color: var(--pietru-color-border);
        background: var(--pietru-color-border);
        color: var(--pietru-color-text);
      }
    }
  }

  &__panel {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
  }

  &__list {
    list-style: none;
    display: grid;
    gap: 0.75rem;
    padding: 0;
    margin: 0;

    li {
      padding: 1rem;
      border: 1px solid var(--pietru-color-panel-strong);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);
    }
  }

  &__hook-form {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.75rem;
    align-items: center;

    input[type="text"],
    input[type="url"],
    select {
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);
      color: var(--pietru-color-text);

      &:focus {
        outline: none;
        border-color: var(--pietru-color-accent);
      }
    }

    button {
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-accent);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-accent);
      color: var(--pietru-color-background);
      font-weight: 500;
    }
  }

  &__hook-active {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--pietru-color-text);
    font-size: 0.9rem;
  }

  &__hook-actions {
    display: flex;
    gap: 0.5rem;

    button[data-active="true"] {
      border-color: var(--pietru-color-accent);
      color: var(--pietru-color-accent);
    }
  }

  &__domains-desc {
    color: var(--pietru-color-text-muted);
    font-size: 0.9rem;
    line-height: 1.5;
  }

  &__domain-form {
    display: flex;
    gap: 0.75rem;

    input {
      flex: 1;
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);
      color: var(--pietru-color-text);

      &:focus {
        outline: none;
        border-color: var(--pietru-color-accent);
      }
    }

    button {
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-accent);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-accent);
      color: var(--pietru-color-background);
      font-weight: 500;

      &:disabled {
        opacity: 0.5;
      }
    }
  }

  &__error {
    color: #e53e3e;
    font-size: 0.875rem;
  }

  &__empty {
    color: var(--pietru-color-text-muted);
    font-size: 0.9rem;
  }

  &__dns-records {
    margin-top: 0.75rem;
    padding: 0.75rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);

    h4 {
      margin: 0 0 0.5rem;
      font-size: 0.9rem;
    }

    p {
      margin: 0 0 0.75rem;
      font-size: 0.8rem;
      color: var(--pietru-color-text-muted);
    }
  }

  &__dns-record {
    display: grid;
    grid-template-columns: auto 1fr 1fr;
    gap: 0.5rem;
    align-items: center;
    padding: 0.4rem 0;
    font-size: 0.8rem;

    label {
      color: var(--pietru-color-text-muted);
      font-weight: 500;
    }

    code {
      padding: 0.25rem 0.5rem;
      background: var(--pietru-color-panel-strong);
      border-radius: var(--pietru-radius-sm);
      font-family: monospace;
      font-size: 0.75rem;
      overflow-x: auto;
      white-space: nowrap;
    }
  }

  p {
    color: var(--pietru-color-text-muted);
  }

  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
  }
}

@media (max-width: 960px) {
  .project-detail-view__hook-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .project-detail-view__hook-form {
    grid-template-columns: 1fr;
  }
}
</style>
