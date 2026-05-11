<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name || 'Inbox'"
    :environment="projectsStore.activeProject?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section v-if="message" class="inbox-detail-view">
      <header class="inbox-detail-view__header">
        <div>
          <h2>{{ message.subject || '(no subject)' }}</h2>
          <div class="inbox-detail-view__meta">
            <span class="inbox-detail-view__status" :data-status="message.status">{{ message.status }}</span>
            <span v-if="getProjectName(message.project_id)" class="inbox-detail-view__project-badge">
              {{ getProjectName(message.project_id) }}
            </span>
          </div>
        </div>
        <button type="button" class="inbox-detail-view__btn-outline" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back to Inbox
        </button>
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
                <RouterLink :to="`/projects/${message.project_id}`">{{ getProjectName(message.project_id) }}</RouterLink>
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

          <section v-if="message.events && message.events.length > 0" class="inbox-detail-view__timeline">
            <h3>Events</h3>
            <ol>
              <li v-for="event in message.events" :key="event.id">
                <strong>{{ event.type }}</strong>
                <span>{{ formatTimestamp(event.created_at) }}</span>
              </li>
            </ol>
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
          <p v-if="!message.text && !message.html" class="inbox-detail-view__empty">No body content available</p>
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

function getProjectName(projectId: string | null): string {
  if (!projectId) return ''
  const project = projectsStore.items.find(p => p.id === projectId)
  return project?.name || projectId
}

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
    align-items: flex-start;
    gap: 1rem;

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--pietru-color-navy);
    }
  }

  &__meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-top: 0.4rem;
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

  &__project-badge {
    display: inline-flex;
    padding: 0.15rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pietru-color-navy) 10%, transparent);
    color: var(--pietru-color-navy);
    font-size: 0.72rem;
    font-weight: 600;
  }

  &__btn-outline {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 160ms ease;
    white-space: nowrap;

    &:hover {
      background: var(--pietru-color-cream);
    }
  }

  &__body {
    display: grid;
    grid-template-columns: 20rem minmax(0, 1fr);
    gap: 1.5rem;
  }

  &__sidebar {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);
  }

  &__content {
    display: grid;
    gap: 1rem;
  }

  &__text,
  &__html {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);

    h3 {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--pietru-color-navy);
    }
  }

  &__sidebar dl {
    display: grid;
    gap: 0.85rem;
  }

  &__sidebar dt {
    color: var(--pietru-color-text-muted);
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__sidebar dd {
    margin: 0.2rem 0 0;
    font-size: 0.9rem;

    a {
      color: var(--pietru-color-accent);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  &__timeline {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--pietru-color-border);

    h3 {
      margin: 0 0 0.75rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--pietru-color-navy);
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
    gap: 0.2rem;
    font-size: 0.85rem;

    strong {
      color: var(--pietru-color-navy);
    }

    span {
      color: var(--pietru-color-text-muted);
      font-size: 0.8rem;
    }
  }

  &__error {
    color: var(--pietru-color-accent);
  }

  &__empty {
    padding: 3rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-surface);
  }

  &__loading {
    padding: 3rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  pre {
    white-space: pre-wrap;
    font-family: var(--pietru-font-family-mono);
    font-size: 0.85rem;
    line-height: 1.6;
    color: var(--pietru-color-text);
  }
}

@media (max-width: 980px) {
  .inbox-detail-view__body {
    grid-template-columns: 1fr;
  }
}
</style>
