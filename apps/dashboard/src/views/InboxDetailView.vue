<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name || 'Inbox'"
    :environment="'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section v-if="message" class="inbox-detail-view">
      <header class="inbox-detail-view__header">
        <div>
          <h2>{{ message.subject || '(no subject)' }}</h2>
          <p>{{ message.status }}</p>
        </div>
        <button type="button" @click="goBack">← Back to Inbox</button>
      </header>

      <div class="inbox-detail-view__body">
        <aside class="inbox-detail-view__sidebar">
          <dl>
            <div>
              <dt>To</dt>
              <dd>{{ message.to_address }}</dd>
            </div>
            <div>
              <dt>From</dt>
              <dd>{{ message.from_address }}</dd>
            </div>
            <div v-if="message.provider">
              <dt>Provider</dt>
              <dd>{{ message.provider }}</dd>
            </div>
            <div v-if="message.project_id">
              <dt>Project</dt>
              <dd>
                <RouterLink :to="`/projects/${message.project_id}`">{{ message.project_id }}</RouterLink>
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{{ formatTimestamp(message.created_at) }}</dd>
            </div>
            <div v-if="message.sent_at">
              <dt>Sent</dt>
              <dd>{{ formatTimestamp(message.sent_at) }}</dd>
            </div>
            <div v-if="message.error">
              <dt>Error</dt>
              <dd class="inbox-detail-view__error">{{ message.error }}</dd>
            </div>
          </dl>

          <section class="inbox-detail-view__timeline">
            <h3>Events</h3>
            <ol v-if="message.events && message.events.length > 0">
              <li v-for="event in message.events" :key="event.id">
                <strong>{{ event.type }}</strong>
                <span>{{ formatTimestamp(event.created_at) }}</span>
              </li>
            </ol>
            <p v-else>No events recorded</p>
          </section>
        </aside>

        <div class="inbox-detail-view__content">
          <section v-if="message.text" class="inbox-detail-view__text">
            <h3>Text Body</h3>
            <pre>{{ message.text }}</pre>
          </section>
          <section v-if="message.html" class="inbox-detail-view__html">
            <h3>HTML Body</h3>
            <MessageHtmlPreview :html="message.html" />
          </section>
          <p v-if="!message.text && !message.html">No body content available</p>
        </div>
      </div>
    </section>

    <div v-else class="inbox-detail-view__loading">Loading…</div>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import MessageHtmlPreview from '@/components/MessageHtmlPreview'
import { useInboxStore } from '@/stores/inbox'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const inboxStore = useInboxStore()
const projectsStore = useProjectsStore()

const messageId = computed(() => route.params.id as string)
const message = computed(() => inboxStore.detail)

onMounted(async () => {
  await projectsStore.list()
  await inboxStore.get(messageId.value)
})

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function goBack() {
  router.push('/inbox')
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}`)
}
</script>

<style lang="scss" scoped>
.inbox-detail-view {
  display: grid;
  gap: 1.5rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    p {
      color: var(--pietru-color-text-muted);
      margin: 0.25rem 0 0;
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 20rem minmax(0, 1fr);
    gap: 1.5rem;
  }

  &__sidebar,
  &__text,
  &__html {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
  }

  &__content {
    display: grid;
    gap: 1rem;
  }

  &__sidebar dl {
    display: grid;
    gap: 0.85rem;
  }

  &__sidebar dt {
    color: var(--pietru-color-text-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__sidebar dd {
    margin: 0.2rem 0 0;

    a {
      color: var(--pietru-color-accent);
    }
  }

  &__timeline {
    margin-top: 1.5rem;

    h3 {
      margin-bottom: 0.75rem;
    }

    p {
      color: var(--pietru-color-text-muted);
    }
  }

  &__timeline ol {
    display: grid;
    gap: 0.75rem;
    padding-left: 1.1rem;
  }

  &__timeline li {
    display: grid;
    gap: 0.25rem;
  }

  &__error {
    color: var(--pietru-color-danger);
  }

  &__loading {
    padding: 3rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  pre {
    white-space: pre-wrap;
    font-family: var(--pietru-font-family-mono);
  }

  button {
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
    cursor: pointer;

    &:hover {
      border-color: var(--pietru-color-accent);
    }
  }
}

@media (max-width: 980px) {
  .inbox-detail-view__body {
    grid-template-columns: 1fr;
  }
}
</style>
