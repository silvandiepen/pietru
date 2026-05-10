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
        <h2>Inbox</h2>
        <form class="inbox-view__filters" @submit.prevent="loadMessages">
          <input v-model="filters.search" type="text" placeholder="Search…" />
          <select v-model="filters.project">
            <option value="">All projects</option>
            <option v-for="project in projectsStore.items" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
          <select v-model="filters.status">
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="failed">Failed</option>
          </select>
          <button type="submit">Filter</button>
        </form>
      </div>

      <div v-if="inboxStore.loading" class="inbox-view__loading">Loading…</div>

      <div class="inbox-view__table-wrapper">
        <table class="inbox-view__table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Subject</th>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="message in inboxStore.items" :key="message.id" class="inbox-view__row" @click="openMessage(message.id)">
              <td>{{ message.status }}</td>
              <td>{{ message.subject || '(no subject)' }}</td>
              <td>{{ message.from_address }}</td>
              <td>{{ message.to_address }}</td>
              <td>{{ formatDate(message.created_at) }}</td>
            </tr>
            <tr v-if="!inboxStore.loading && inboxStore.items.length === 0">
              <td colspan="5" class="inbox-view__empty">No messages found</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="inboxStore.nextCursor" class="inbox-view__pagination">
        <button type="button" @click="loadMore">Load more</button>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
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
  gap: 1rem;

  &__header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__header h2 {
    margin: 0;
  }

  &__filters {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.75rem;
  }

  &__loading {
    padding: 2rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  &__table-wrapper {
    overflow: auto;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
  }

  &__table {
    width: 100%;
    border-collapse: collapse;

    th {
      padding: 0.9rem 1rem;
      text-align: left;
      color: var(--pietru-color-text-muted);
      border-bottom: 1px solid var(--pietru-color-border);
    }

    td {
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--pietru-color-border);
    }
  }

  &__row {
    cursor: pointer;

    &:hover {
      background: var(--pietru-color-surface-sidebar);
    }
  }

  &__empty {
    text-align: center;
    padding: 2rem;
    color: var(--pietru-color-text-muted);
  }

  &__pagination {
    display: flex;
    justify-content: center;
  }

  input,
  select,
  button {
    padding: 0.8rem 0.9rem;
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

@media (max-width: 760px) {
  .inbox-view__filters {
    grid-template-columns: 1fr;
  }
}
</style>
