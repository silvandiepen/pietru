<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name || t('dashboard.fallbackTitle')"
    :environment="projectsStore.activeProject?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="dashboard-view">
      <div class="dashboard-view__header">
        <div>
          <h2>{{ $t('dashboard.title') }}</h2>
          <p>{{ $t('dashboard.description') }}</p>
        </div>
        <button type="button" @click="showCreate = !showCreate">
          {{ showCreate ? $t('dashboard.buttonCancel') : $t('dashboard.buttonNewProject') }}
        </button>
      </div>

      <div v-if="stats" class="dashboard-view__stats">
        <div class="dashboard-view__stat-card">
          <span class="dashboard-view__stat-value">{{ stats.totals.sent }}</span>
          <span class="dashboard-view__stat-label">Sent</span>
        </div>
        <div class="dashboard-view__stat-card">
          <span class="dashboard-view__stat-value">{{ stats.totals.failed }}</span>
          <span class="dashboard-view__stat-label">Failed</span>
        </div>
        <div class="dashboard-view__stat-card">
          <span class="dashboard-view__stat-value">{{ stats.totals.captured }}</span>
          <span class="dashboard-view__stat-label">Captured</span>
        </div>
        <div class="dashboard-view__stat-card">
          <span class="dashboard-view__stat-value">{{ stats.totals.received }}</span>
          <span class="dashboard-view__stat-label">Received</span>
        </div>
      </div>

      <form v-if="showCreate" class="dashboard-view__create" @submit.prevent="createProject">
        <input v-model="createForm.name" type="text" :placeholder="$t('dashboard.placeholderProjectName')" required />
        <input v-model="createForm.slug" type="text" :placeholder="$t('dashboard.placeholderProjectSlug')" required />
        <button type="submit">{{ $t('dashboard.buttonCreate') }}</button>
      </form>

      <div class="dashboard-view__grid">
        <article v-for="project in projectsStore.items" :key="project.id" class="dashboard-view__card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.slug }}</p>
          <div class="dashboard-view__actions">
            <RouterLink :to="`/projects/${project.id}`">{{ $t('dashboard.linkOpen') }}</RouterLink>
            <RouterLink :to="`/projects/${project.id}/messages`">{{ $t('dashboard.linkMessages') }}</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppLayout from '@/components/AppLayout'
import { useProjectsStore } from '@/stores/projects'
import { useStatsStore } from '@/stores/stats'

const projectsStore = useProjectsStore()
const statsStore = useStatsStore()
const router = useRouter()
const { t } = useI18n()
const showCreate = ref(false)
const createForm = reactive({
  name: '',
  slug: '',
})

const stats = computed(() => statsStore.stats)

onMounted(async () => {
  await Promise.all([
    projectsStore.list(),
    statsStore.fetch(),
  ])
})

async function createProject() {
  const project = await projectsStore.create(createForm)
  showCreate.value = false
  createForm.name = ''
  createForm.slug = ''
  await router.push(`/projects/${project.id}`)
}

async function changeProject(projectId: string) {
  projectsStore.setActiveProject(projectId)
  await router.push(`/projects/${projectId}`)
}
</script>

<style lang="scss" scoped>
.dashboard-view {
  display: grid;
  gap: 1.5rem;

  &__header,
  &__actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  &__create,
  &__grid {
    display: grid;
    gap: 1rem;
  }

  &__create {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  &__stat-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);
  }

  &__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pietru-color-text);
  }

  &__stat-label {
    font-size: 0.8rem;
    color: var(--pietru-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__card {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);

    p {
      color: var(--pietru-color-text-muted);
    }
  }

  input,
  button,
  a {
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
    text-decoration: none;
  }

  input {
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

@media (max-width: 760px) {
  .dashboard-view__create {
    grid-template-columns: 1fr;
  }

  .dashboard-view__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
