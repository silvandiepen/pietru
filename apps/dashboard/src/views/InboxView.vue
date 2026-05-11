<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name || 'Inbox'"
    :environment="projectsStore.activeProject?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="inbox-view">
      <div class="inbox-view__header">
        <div>
          <h2>Inbox</h2>
          <p>All incoming and outgoing mail across your projects.</p>
        </div>
      </div>

      <form class="inbox-view__filters" @submit.prevent="loadMessages">
        <input v-model="filters.search" type="text" placeholder="Search messages…" class="inbox-view__input" />
        <select v-model="filters.project" class="inbox-view__select">
          <option value="">All projects</option>
          <option v-for="project in projectsStore.items" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
        <select v-model="filters.status" class="inbox-view__select">
          <option value="">All statuses</option>
          <option value="queued">Queued</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="received">Received</option>
        </select>
        <button type="submit" class="inbox-view__btn-primary">Filter</button>
      </form>

      <div v-if="inboxStore.loading" class="inbox-view__loading">Loading…</div>

      <div v-else class="inbox-view__table-wrapper">
        <table class="inbox-view__table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Subject</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="message in inboxStore.items"
              :key="message.id"
              class="inbox-view__row"
              @click="openMessage(message.id)"
            >
              <td>
                <span v-if="getProjectName(message.project_id)" class="inbox-view__project-badge">
                  {{ getProjectName(message.project_id) }}
                </span>
                <span v-else class="inbox-view__muted">—</span>
              </td>
              <td>
                <span class="inbox-view__direction" :data-direction="getDirection(message)">
                  {{ getDirection(message) }}
                </span>
              </td>
              <td>
                <span class="inbox-view__status" :data-status="message.status">
                  {{ message.status }}
                </span>
              </td>
              <td class="inbox-view__subject">{{ message.subject || '(no subject)' }}</td>
              <td class="inbox-view__address">{{ message.from_address }}</td>
              <td class="inbox-view__address">{{ message.to_address }}</td>
              <td class="inbox-view__date">{{ formatDate(message.created_at) }}</td>
            </tr>
            <tr v-if="!inboxStore.loading && inboxStore.items.length === 0">
              <td colspan="7" class="inbox-view__empty">No messages found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="inboxStore.nextCursor" class="inbox-view__pagination">
        <button type="button" class="inbox-view__btn-outline" @click="loadMore">Load more</button>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useInboxStore } from '@/stores/inbox'
import { useProjectsStore } from '@/stores/projects'

const router = useRouter()
const inboxStore = useInboxStore()
const projectsStore = useProjectsStore()

const filters = reactive({
  project: '',
  search: '',
  status: '',
})

const projectMap = computed(() => {
  const map: Record<string, string> = {}
  for (const project of projectsStore.items) {
    map[project.id] = project.name
  }
  return map
})

function getProjectName(projectId: string | null): string {
  if (!projectId) return ''
  return projectMap.value[projectId] || projectId
}

function getDirection(message: { from_address: string; to_address: string; project_id: string | null }): string {
  if (!message.project_id) return 'incoming'
  const project = projectsStore.items.find(p => p.id === message.project_id)
  if (!project) return 'outgoing'
  return 'outgoing'
}

onMounted(async () => {
  await projectsStore.list()
  await loadMessages()
})

async function loadMessages() {
  await inboxStore.list({
    project: filters.project || undefined,
    search: filters.search || undefined,
    status: filters.status || undefined,
  })
}

async function loadMore() {
  await inboxStore.list({
    project: filters.project || undefined,
    search: filters.search || undefined,
    status: filters.status || undefined,
    cursor: inboxStore.nextCursor || undefined,
  })
}

async function openMessage(messageId: string) {
  await router.push(`/inbox/${messageId}`)
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}`)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<style lang="scss" scoped>
.inbox-view {
  display: grid;
  gap: 1.25rem;

  &__header {
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

  &__filters {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr auto;
    gap: 0.75rem;
    align-items: end;
  }

  &__input,
  &__select {
    padding: 0.6rem 0.85rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface);
    color: var(--pietru-color-text);
    font-size: 0.85rem;

    &:focus {
      outline: none;
      border-color: var(--pietru-color-accent);
      box-shadow: 0 0 0 3px rgba(239, 71, 40, 0.1);
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
    padding: 0.5rem 1.2rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 160ms ease;

    &:hover {
      background: var(--pietru-color-cream);
    }
  }

  &__loading {
    padding: 3rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  &__table-wrapper {
    overflow: auto;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      padding: 0.8rem 1rem;
      text-align: left;
      color: var(--pietru-color-text-muted);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--pietru-color-border);
      background: var(--pietru-color-cream-card);
    }

    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--pietru-color-border);
      font-size: 0.85rem;
    }
  }

  &__row {
    cursor: pointer;
    transition: background-color 120ms ease;

    &:hover {
      background: var(--pietru-color-cream-card);
    }

    &:last-child td {
      border-bottom: none;
    }
  }

  &__project-badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pietru-color-navy) 10%, transparent);
    color: var(--pietru-color-navy);
    font-size: 0.75rem;
    font-weight: 600;
  }

  &__muted {
    color: var(--pietru-color-text-muted);
  }

  &__direction {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    &[data-direction='incoming'] {
      background: var(--pietru-stat-received-bg);
      color: var(--pietru-stat-received-color);
    }

    &[data-direction='outgoing'] {
      background: var(--pietru-stat-sent-bg);
      color: var(--pietru-stat-sent-color);
    }
  }

  &__status {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;

    &[data-status='sent'],
    &[data-status='delivered'] {
      background: color-mix(in srgb, var(--pietru-color-success) 12%, transparent);
      color: var(--pietru-color-success);
    }

    &[data-status='failed'] {
      background: var(--pietru-stat-sent-bg);
      color: var(--pietru-color-accent);
    }

    &[data-status='queued'] {
      background: var(--pietru-stat-captured-bg);
      color: var(--pietru-color-warning);
    }

    &[data-status='received'] {
      background: var(--pietru-stat-received-bg);
      color: var(--pietru-color-success);
    }
  }

  &__subject {
    font-weight: 500;
    color: var(--pietru-color-navy);
    max-width: 20rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__address {
    color: var(--pietru-color-text-muted);
    max-width: 14rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__date {
    color: var(--pietru-color-text-muted);
    white-space: nowrap;
    font-size: 0.8rem;
  }

  &__empty {
    text-align: center;
    padding: 3rem;
    color: var(--pietru-color-text-muted);
  }

  &__pagination {
    display: flex;
    justify-content: center;
    padding-top: 0.5rem;
  }
}

@media (max-width: 1080px) {
  .inbox-view__filters {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 760px) {
  .inbox-view__filters {
    grid-template-columns: 1fr;
  }
}
</style>
