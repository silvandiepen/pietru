<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name"
    environment="capture"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="test-inboxes-view">
      <header class="test-inboxes-view__header">
        <div>
          <h2>{{ $t('testAliases.title') }}</h2>
          <p>{{ $t('testAliases.description') }}</p>
        </div>
        <div class="test-inboxes-view__counter">
          {{ store.count }} / {{ store.limit }}
        </div>
      </header>

      <!-- Create form -->
      <form class="test-inboxes-view__create" @submit.prevent="handleCreate">
        <div class="test-inboxes-view__field">
          <label>{{ $t('testAliases.labelAlias') }}</label>
          <div class="test-inboxes-view__input-row">
            <input
              v-model="newLocalPart"
              type="text"
              :placeholder="$t('testAliases.placeholderAlias')"
              required
              pattern="[a-z0-9][a-z0-9._-]*"
              :disabled="!store.canCreate || creating"
            />
            <span class="test-inboxes-view__domain">@test.pietru.dev</span>
          </div>
        </div>
        <div class="test-inboxes-view__field">
          <label>{{ $t('testAliases.labelProject') }}</label>
          <select v-model="newProjectId">
            <option value="">{{ $t('testAliases.optionNoProject') }}</option>
            <option
              v-for="project in projectsStore.items"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="test-inboxes-view__field">
          <label>{{ $t('testAliases.labelDescription') }}</label>
          <input
            v-model="newDescription"
            type="text"
            :placeholder="$t('testAliases.placeholderDescription')"
          />
        </div>
        <button type="submit" :disabled="!store.canCreate || creating">
          {{ creating ? '...' : $t('testAliases.buttonCreate') }}
        </button>
      </form>

      <!-- Error -->
      <p v-if="store.error" class="test-inboxes-view__error">{{ store.error }}</p>

      <!-- Empty state -->
      <div v-if="!store.loading && store.items.length === 0" class="test-inboxes-view__empty">
        {{ $t('testAliases.empty') }}
      </div>

      <!-- Alias list -->
      <div v-if="store.items.length > 0" class="test-inboxes-view__list">
        <div
          v-for="alias in store.items"
          :key="alias.id"
          class="test-inboxes-view__card"
          :class="{ 'test-inboxes-view__card--inactive': !alias.isActive }"
        >
          <div class="test-inboxes-view__card-main">
            <div class="test-inboxes-view__card-email">
              <span class="test-inboxes-view__card-alias">{{ alias.localPart }}</span>
              <span class="test-inboxes-view__card-at">@test.pietru.dev</span>
            </div>
            <div class="test-inboxes-view__card-meta">
              <span v-if="alias.projectName" class="test-inboxes-view__card-project">
                {{ alias.projectName }}
              </span>
              <span v-if="alias.description" class="test-inboxes-view__card-desc">
                {{ alias.description }}
              </span>
              <span class="test-inboxes-view__card-date">
                {{ formatDate(alias.createdAt) }}
              </span>
            </div>
          </div>
          <div class="test-inboxes-view__card-actions">
            <button
              class="test-inboxes-view__toggle"
              :class="{ 'test-inboxes-view__toggle--active': alias.isActive }"
              @click="store.toggle(alias.id)"
            >
              {{ alias.isActive ? $t('testAliases.active') : $t('testAliases.inactive') }}
            </button>
            <button class="test-inboxes-view__copy" @click="copyEmail(alias.email)">
              {{ $t('testAliases.copy') }}
            </button>
            <button class="test-inboxes-view__delete" @click="handleDelete(alias)">
              {{ $t('testAliases.delete') }}
            </button>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useProjectsStore } from '@/stores/projects'
import { useTestAliasesStore } from '@/stores/testAliases'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const store = useTestAliasesStore()

const newLocalPart = ref('')
const newProjectId = ref('')
const newDescription = ref('')
const creating = ref(false)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function copyEmail(email: string) {
  try {
    await navigator.clipboard.writeText(email)
  } catch {
    // fallback — ignore
  }
}

async function handleCreate() {
  const localPart = newLocalPart.value.trim().toLowerCase()
  if (!localPart) return

  creating.value = true
  try {
    await store.create({
      localPart,
      projectId: newProjectId.value || null,
      description: newDescription.value.trim() || null,
    })
    newLocalPart.value = ''
    newProjectId.value = ''
    newDescription.value = ''
  } catch {
    // store handles error
  } finally {
    creating.value = false
  }
}

async function handleDelete(alias: { id: string; email: string }) {
  if (!confirm(`Delete ${alias.email}?`)) return
  await store.remove(alias.id)
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}/test-inboxes`)
}

onMounted(async () => {
  await projectsStore.list()
  projectsStore.setActiveProject(route.params.id as string)
  await store.list()
})
</script>

<style lang="scss" scoped>
.test-inboxes-view {
  display: grid;
  gap: 1.5rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;

    h2 {
      margin: 0 0 0.35rem;
      font-size: 1.2rem;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--pietru-color-text-muted);
      font-size: 0.85rem;
    }
  }

  &__counter {
    padding: 0.35rem 0.75rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    font-size: 0.8rem;
    color: var(--pietru-color-text-muted);
    white-space: nowrap;
  }

  &__create {
    display: grid;
    grid-template-columns: 1.5fr 1fr 1fr auto;
    gap: 0.75rem;
    align-items: end;

    button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-text);
      color: var(--pietru-color-background);
      cursor: pointer;
      font-size: 0.85rem;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  &__field {
    display: grid;
    gap: 0.25rem;

    label {
      font-size: 0.75rem;
      color: var(--pietru-color-text-muted);
    }

    input,
    select {
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: transparent;
      color: var(--pietru-color-text);
      font-size: 0.85rem;
    }
  }

  &__input-row {
    display: flex;
    align-items: center;

    input {
      border-radius: var(--pietru-radius-sm) 0 0 var(--pietru-radius-sm);
      border-right: none;
    }
  }

  &__domain {
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: 0 var(--pietru-radius-sm) var(--pietru-radius-sm) 0;
    background: var(--pietru-color-border);
    color: var(--pietru-color-text-muted);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  &__error {
    padding: 0.75rem 1rem;
    border: 1px solid #e74c3c;
    border-radius: var(--pietru-radius-sm);
    color: #e74c3c;
    font-size: 0.85rem;
    margin: 0;
  }

  &__empty {
    padding: 3rem 2rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
    font-size: 0.9rem;
  }

  &__list {
    display: grid;
    gap: 0.5rem;
  }

  &__card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);

    &--inactive {
      opacity: 0.5;
    }
  }

  &__card-main {
    display: grid;
    gap: 0.25rem;
    min-width: 0;
  }

  &__card-email {
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
    overflow: hidden;
  }

  &__card-alias {
    font-family: monospace;
    font-weight: 500;
    font-size: 0.9rem;
  }

  &__card-at {
    color: var(--pietru-color-text-muted);
    font-size: 0.8rem;
  }

  &__card-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    color: var(--pietru-color-text-muted);
  }

  &__card-project {
    padding: 0.1rem 0.4rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    font-size: 0.7rem;
  }

  &__card-desc {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__card-date {
    white-space: nowrap;
    font-size: 0.75rem;
  }

  &__card-actions {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  &__toggle {
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text-muted);
    cursor: pointer;
    font-size: 0.75rem;

    &--active {
      background: #27ae60;
      border-color: #27ae60;
      color: #fff;
    }
  }

  &__copy {
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text-muted);
    cursor: pointer;
    font-size: 0.75rem;

    &:hover {
      color: var(--pietru-color-text);
    }
  }

  &__delete {
    padding: 0.2rem 0.6rem;
    border: 1px solid transparent;
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: #e74c3c;
    cursor: pointer;
    font-size: 0.75rem;

    &:hover {
      border-color: #e74c3c;
    }
  }
}

@media (max-width: 700px) {
  .test-inboxes-view {
    &__create {
      grid-template-columns: 1fr;
    }

    &__card {
      flex-direction: column;
      align-items: flex-start;
    }
  }
}
</style>
