<template>
  <AppLayout
    :project-name="project?.name"
    :environment="project?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="project-detail-view">
      <header class="project-detail-view__header">
        <div>
          <h2>{{ project?.name || 'Project' }}</h2>
          <p>{{ project?.slug }}</p>
        </div>
        <button type="button" @click="dialogOpen = true">Create API key</button>
      </header>

      <div class="project-detail-view__tabs">
        <button
          v-for="tabOption in tabs"
          :key="tabOption"
          type="button"
          :data-active="tab === tabOption"
          @click="tab = tabOption"
        >
          {{ tabOption }}
        </button>
      </div>

      <section v-if="tab === 'environments'" class="project-detail-view__panel">
        <h3>Environments</h3>
        <div class="project-detail-view__environments">
          <EnvironmentBadge environment="dev" />
          <EnvironmentBadge environment="preview" />
          <EnvironmentBadge environment="prod" />
        </div>
      </section>

      <section v-if="tab === 'api keys'" class="project-detail-view__panel">
        <h3>API keys</h3>
        <ul class="project-detail-view__list">
          <li v-for="apiKey in apiKeys" :key="apiKey.id">
            <div>
              <strong>{{ apiKey.name || apiKey.keyPrefix }}</strong>
              <p>{{ apiKey.environment }} · {{ apiKey.keyPrefix }}</p>
            </div>
            <button type="button" @click="revokeApiKey(apiKey.id)">Revoke</button>
          </li>
        </ul>
      </section>

      <section v-if="tab === 'provider config'" class="project-detail-view__panel">
        <h3>Provider config</h3>
        <ProviderConfigForm @submit="createProviderConfig" />
        <ul class="project-detail-view__list">
          <li v-for="config in providerConfigs" :key="config.id">
            <div>
              <strong>{{ config.providerType }}</strong>
              <p>{{ config.environment }} · {{ config.mode }} · {{ config.defaultFrom }}</p>
            </div>
            <button type="button" @click="validateProviderConfig(config.id)">Validate</button>
          </li>
        </ul>
        <p v-if="providerValidationMessage">{{ providerValidationMessage }}</p>
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
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import ApiKeyCreateDialog from '@/components/ApiKeyCreateDialog'
import AppLayout from '@/components/AppLayout'
import EnvironmentBadge from '@/components/EnvironmentBadge'
import ProviderConfigForm from '@/components/ProviderConfigForm'
import { useApiKeysStore } from '@/stores/apiKeys'
import { useProjectsStore } from '@/stores/projects'
import { useProvidersStore } from '@/stores/providers'
import type { ApiKeyCreateDialogSubmitPayload } from '@/components/ApiKeyCreateDialog/ApiKeyCreateDialog.model'
import type { ProviderConfigPayload } from '@/stores/providers.model'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const apiKeysStore = useApiKeysStore()
const providersStore = useProvidersStore()

const tabs = ['environments', 'api keys', 'provider config'] as const
const tab = ref<(typeof tabs)[number]>('environments')
const dialogOpen = ref(false)
const providerValidationMessage = ref('')

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectsStore.items.find((item) => item.id === projectId.value) || null)
const apiKeys = computed(() => apiKeysStore.items[projectId.value] || [])
const providerConfigs = computed(() => providersStore.items[projectId.value] || [])

onMounted(async () => {
  await Promise.all([
    projectsStore.list(),
    projectsStore.get(projectId.value),
    apiKeysStore.list(projectId.value),
    providersStore.list(projectId.value),
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
  providerValidationMessage.value = result.valid ? 'Provider config is valid.' : result.message || 'Validation failed.'
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
      background: var(--pietru-color-panel);

      &[data-active='true'] {
        border-color: var(--pietru-color-accent);
        color: var(--pietru-color-accent);
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
    }
  }

  p {
    color: var(--pietru-color-text-muted);
  }

  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);
  }
}
</style>
