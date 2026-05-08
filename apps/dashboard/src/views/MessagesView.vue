<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name"
    :environment="filters.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="messages-view">
      <form class="messages-view__filters" @submit.prevent="loadMessages">
        <select v-model="filters.status">
          <option value="">All statuses</option>
          <option value="queued">queued</option>
          <option value="sent">sent</option>
          <option value="delivered">delivered</option>
          <option value="failed">failed</option>
        </select>
        <input v-model="filters.to" type="text" placeholder="To" />
        <input v-model="filters.from" type="text" placeholder="From" />
        <input v-model="filters.dateFrom" type="date" />
        <input v-model="filters.dateTo" type="date" />
        <button type="submit">Apply filters</button>
      </form>

      <div class="messages-view__table-wrapper">
        <table class="messages-view__table">
          <thead>
            <tr>
              <th>Status</th>
              <th>To</th>
              <th>From</th>
              <th>Subject</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <MessageRow
              v-for="message in messagesStore.items"
              :key="message.id"
              :message="message"
              @select="openMessage"
            />
          </tbody>
        </table>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import MessageRow from '@/components/MessageRow'
import { useMessagesStore } from '@/stores/messages'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const messagesStore = useMessagesStore()

const projectId = route.params.id as string
const filters = reactive({
  environment: 'dev',
  status: '',
  to: '',
  from: '',
  dateFrom: '',
  dateTo: '',
})

onMounted(async () => {
  await projectsStore.list()
  projectsStore.setActiveProject(projectId)
  await loadMessages()
})

async function loadMessages() {
  await messagesStore.list(projectId, filters)
}

async function openMessage(messageId: string) {
  await router.push(`/projects/${projectId}/messages/${messageId}`)
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}/messages`)
}
</script>

<style lang="scss" scoped>
.messages-view {
  display: grid;
  gap: 1rem;

  &__filters {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 0.75rem;
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
      border-bottom: 1px solid var(--pietru-color-panel-strong);
    }
  }

  input,
  select,
  button {
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);
  }

  button {
    background: var(--pietru-color-accent);
    color: white;
    border-color: var(--pietru-color-accent);
  }
}

@media (max-width: 1080px) {
  .messages-view__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .messages-view__filters {
    grid-template-columns: 1fr;
  }
}
</style>
