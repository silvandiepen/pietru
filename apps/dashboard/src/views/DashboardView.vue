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
        <button type="button" class="dashboard-view__btn-primary" @click="showCreate = !showCreate">
          {{ showCreate ? $t('dashboard.buttonCancel') : $t('dashboard.buttonNewProject') }}
        </button>
      </div>

      <div v-if="stats" class="dashboard-view__stats">
        <div class="dashboard-view__stat-card dashboard-view__stat-card--sent">
          <span class="dashboard-view__stat-icon dashboard-view__stat-icon--sent">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </span>
          <div>
            <span class="dashboard-view__stat-value">{{ stats.totals.sent }}</span>
            <span class="dashboard-view__stat-label">Sent</span>
          </div>
        </div>
        <div class="dashboard-view__stat-card dashboard-view__stat-card--failed">
          <span class="dashboard-view__stat-icon dashboard-view__stat-icon--failed">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          </span>
          <div>
            <span class="dashboard-view__stat-value">{{ stats.totals.failed }}</span>
            <span class="dashboard-view__stat-label">Failed</span>
          </div>
        </div>
        <div class="dashboard-view__stat-card dashboard-view__stat-card--captured">
          <span class="dashboard-view__stat-icon dashboard-view__stat-icon--captured">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </span>
          <div>
            <span class="dashboard-view__stat-value">{{ stats.totals.captured }}</span>
            <span class="dashboard-view__stat-label">Captured</span>
          </div>
        </div>
        <div class="dashboard-view__stat-card dashboard-view__stat-card--received">
          <span class="dashboard-view__stat-icon dashboard-view__stat-icon--received">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          <div>
            <span class="dashboard-view__stat-value">{{ stats.totals.received }}</span>
            <span class="dashboard-view__stat-label">Received</span>
          </div>
        </div>
      </div>

      <form v-if="showCreate" class="dashboard-view__create" @submit.prevent="createProject">
        <input v-model="createForm.name" type="text" :placeholder="$t('dashboard.placeholderProjectName')" required />
        <input v-model="createForm.slug" type="text" :placeholder="$t('dashboard.placeholderProjectSlug')" required />
        <button type="submit" class="dashboard-view__btn-primary">{{ $t('dashboard.buttonCreate') }}</button>
      </form>

      <div class="dashboard-view__projects">
        <h3 class="dashboard-view__projects-title">Projects</h3>
        <div class="dashboard-view__project-list">
          <article v-for="project in projectsStore.items" :key="project.id" class="dashboard-view__project-row">
            <div class="dashboard-view__project-avatar" :style="{ backgroundColor: getAvatarColor(project.name) }">
              {{ project.name.charAt(0).toUpperCase() }}
            </div>
            <div class="dashboard-view__project-info">
              <span class="dashboard-view__project-name">{{ project.name }}</span>
              <span class="dashboard-view__project-slug">{{ project.slug }}</span>
            </div>
            <div class="dashboard-view__project-actions">
              <RouterLink :to="`/projects/${project.id}`" class="dashboard-view__btn-outline">Open</RouterLink>
              <RouterLink :to="`/projects/${project.id}/messages`" class="dashboard-view__btn-outline">Messages</RouterLink>
            </div>
          </article>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'lezu-i18n/vue'

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

const avatarColors: Record<string, string> = {
  Paggi: '#EF4728',
  Emila: '#6B7B8D',
  Lezu: '#D4A017',
  Chikki: '#7BAE7F',
}

function getAvatarColor(name: string): string {
  return avatarColors[name] || '#6B7B8D'
}

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

  &__header {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--pietru-color-navy);
    }

    p {
      margin: 0.25rem 0 0;
      color: var(--pietru-color-text-muted);
      font-size: 0.9rem;
    }
  }

  &__btn-primary {
    display: inline-flex;
    align-items: center;
    padding: 0.6rem 1.2rem;
    border: none;
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-accent);
    color: #ffffff;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 160ms ease;
    white-space: nowrap;

    &:hover {
      background: #d4351a;
    }
  }

  &__btn-outline {
    display: inline-flex;
    align-items: center;
    padding: 0.45rem 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text);
    font-size: 0.82rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background-color 160ms ease, border-color 160ms ease;
    white-space: nowrap;

    &:hover {
      background: var(--pietru-color-cream);
      border-color: var(--pietru-color-text-muted);
    }
  }

  &__create {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;

    input {
      padding: 0.7rem 0.9rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface);
      color: var(--pietru-color-text);
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: var(--pietru-color-accent);
        box-shadow: 0 0 0 3px rgba(239, 71, 40, 0.1);
      }
    }

    button {
      justify-self: start;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
  }

  &__stat-card {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    padding: 1.1rem 1.25rem;
    border-radius: var(--pietru-radius-md);

    &--sent {
      background: var(--pietru-stat-sent-bg);
    }

    &--failed {
      background: var(--pietru-stat-failed-bg);
    }

    &--captured {
      background: var(--pietru-stat-captured-bg);
    }

    &--received {
      background: var(--pietru-stat-received-bg);
    }

    > div {
      display: flex;
      flex-direction: column;
    }
  }

  &__stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--sent {
      color: var(--pietru-stat-sent-color);
    }

    &--failed {
      color: var(--pietru-stat-failed-color);
    }

    &--captured {
      color: var(--pietru-stat-captured-color);
    }

    &--received {
      color: var(--pietru-stat-received-color);
    }
  }

  &__stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--pietru-color-text);
    line-height: 1.2;
  }

  &__stat-label {
    font-size: 0.7rem;
    color: var(--pietru-color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 600;
  }

  &__projects {
    display: grid;
    gap: 1rem;
  }

  &__projects-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--pietru-color-navy);
  }

  &__project-list {
    display: grid;
    gap: 0.5rem;
  }

  &__project-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.9rem 1.1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);
    transition: box-shadow 160ms ease;
  }

  &__project-avatar {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: #ffffff;
    flex-shrink: 0;
  }

  &__project-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
  }

  &__project-name {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--pietru-color-navy);
  }

  &__project-slug {
    font-size: 0.82rem;
    color: var(--pietru-color-text-muted);
  }

  &__project-actions {
    display: flex;
    gap: 0.5rem;
    margin-left: auto;
    flex-shrink: 0;
  }
}

@media (max-width: 760px) {
  .dashboard-view__create {
    grid-template-columns: 1fr;
  }

  .dashboard-view__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-view__project-row {
    flex-wrap: wrap;
  }

  .dashboard-view__project-actions {
    width: 100%;
    justify-content: flex-end;
    padding-top: 0.5rem;
    margin-left: 0;
  }
}
</style>
