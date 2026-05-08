<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name"
    :environment="message?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section v-if="message" class="message-detail-view">
      <aside class="message-detail-view__sidebar">
        <h2>{{ message.subject }}</h2>
        <dl>
          <div>
            <dt>Status</dt>
            <dd>{{ message.status }}</dd>
          </div>
          <div>
            <dt>To</dt>
            <dd>{{ message.toAddress }}</dd>
          </div>
          <div>
            <dt>From</dt>
            <dd>{{ message.fromAddress }}</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd>{{ message.provider || 'n/a' }}</dd>
          </div>
          <div v-if="message.error">
            <dt>Error</dt>
            <dd class="message-detail-view__error">{{ message.error }}</dd>
          </div>
        </dl>

        <section class="message-detail-view__timeline">
          <h3>Events</h3>
          <ol>
            <li v-for="event in message.events || []" :key="event.id">
              <strong>{{ event.type }}</strong>
              <span>{{ formatTimestamp(event.createdAt) }}</span>
            </li>
          </ol>
        </section>
      </aside>

      <div class="message-detail-view__content">
        <MessageHtmlPreview :html="message.html" />
        <section class="message-detail-view__text">
          <h3>Text body</h3>
          <pre>{{ message.text || 'No text body available.' }}</pre>
        </section>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import MessageHtmlPreview from '@/components/MessageHtmlPreview'
import { useMessagesStore } from '@/stores/messages'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const messagesStore = useMessagesStore()
const projectsStore = useProjectsStore()

const projectId = computed(() => route.params.id as string)
const messageId = computed(() => route.params.messageId as string)
const message = computed(() => messagesStore.detail)

onMounted(async () => {
  await projectsStore.list()
  projectsStore.setActiveProject(projectId.value)
  await messagesStore.get(messageId.value)
})

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}`)
}
</script>

<style lang="scss" scoped>
.message-detail-view {
  display: grid;
  grid-template-columns: 20rem minmax(0, 1fr);
  gap: 1.5rem;

  &__sidebar,
  &__text {
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

  pre {
    white-space: pre-wrap;
    font-family: var(--pietru-font-family-mono);
  }
}

@media (max-width: 980px) {
  .message-detail-view {
    grid-template-columns: 1fr;
  }
}
</style>
