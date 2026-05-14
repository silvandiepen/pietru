<template>
  <AppLayout
    :project-name="''"
    :projects="[]"
    :active-project-id="''"
  >
    <section class="mailing-list-detail">
      <header class="mailing-list-detail__header">
        <div>
          <router-link to="/mailing-lists" class="mailing-list-detail__back">&larr; Mailing Lists</router-link>
          <h2 v-if="store.currentList">{{ store.currentList.name }}</h2>
          <p v-if="store.currentList">{{ store.currentList.slug }} · {{ store.currentList.projectId }}</p>
        </div>
      </header>

      <div v-if="store.loading && !store.currentList" class="mailing-list-detail__empty">Loading...</div>

      <template v-if="store.currentList">
        <!-- Stats -->
        <div class="mailing-list-detail__stats">
          <div class="mailing-list-detail__stat">
            <strong>{{ store.currentList.subscriberCounts?.confirmed ?? 0 }}</strong>
            <span>Confirmed</span>
          </div>
          <div class="mailing-list-detail__stat">
            <strong>{{ store.currentList.subscriberCounts?.pending ?? 0 }}</strong>
            <span>Pending</span>
          </div>
          <div class="mailing-list-detail__stat">
            <strong>{{ store.currentList.subscriberCounts?.unsubscribed ?? 0 }}</strong>
            <span>Unsubscribed</span>
          </div>
        </div>

        <!-- Subscriber list -->
        <div class="mailing-list-detail__panel">
          <div class="mailing-list-detail__panel-header">
            <h3>Subscribers</h3>
            <div class="mailing-list-detail__filters">
              <button
                v-for="s in ['all', 'confirmed', 'pending', 'unsubscribed']"
                :key="s"
                type="button"
                :data-active="statusFilter === s"
                @click="statusFilter = s"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <div v-if="store.loading" class="mailing-list-detail__empty">Loading...</div>

          <div v-else-if="!store.subscribers.length" class="mailing-list-detail__empty">
            No subscribers{{ statusFilter !== 'all' ? ` with status "${statusFilter}"` : '' }} yet.
          </div>

          <ul v-else class="mailing-list-detail__list">
            <li v-for="sub in store.subscribers" :key="sub.id">
              <div>
                <strong>{{ sub.name || sub.email }}</strong>
                <p v-if="sub.name">{{ sub.email }}</p>
                <p>
                  <span :class="`mailing-list-detail__status mailing-list-detail__status--${sub.status}`">
                    {{ sub.status }}
                  </span>
                  · Subscribed {{ formatDate(sub.subscribedAt) }}
                  <template v-if="sub.confirmedAt"> · Confirmed {{ formatDate(sub.confirmedAt) }}</template>
                </p>
                <p v-if="sub.meta && Object.keys(sub.meta).length" class="mailing-list-detail__meta">
                  {{ JSON.stringify(sub.meta) }}
                </p>
              </div>
              <button type="button" @click="removeSubscriber(sub.id)">Remove</button>
            </li>
          </ul>

          <p v-if="store.subscribersTotal > store.subscribers.length" class="mailing-list-detail__more">
            Showing {{ store.subscribers.length }} of {{ store.subscribersTotal }}
          </p>
        </div>

        <!-- List settings -->
        <details class="mailing-list-detail__settings">
          <summary>List Settings</summary>
          <form class="mailing-list-detail__settings-form" @submit.prevent="updateList">
            <label>
              Name
              <input v-model="editForm.name" type="text" />
            </label>
            <label>
              Description
              <input v-model="editForm.description" type="text" />
            </label>
            <label>
              Confirmation email subject
              <input v-model="editForm.confirmationEmailSubject" type="text" />
            </label>
            <label>
              Success redirect URL
              <input v-model="editForm.confirmationSuccessUrl" type="url" />
            </label>
            <button type="submit">Save</button>
          </form>
        </details>
      </template>

      <p v-if="store.error" class="mailing-list-detail__error">{{ store.error }}</p>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useMailingListsStore } from '@/stores/mailingLists'

const route = useRoute()
const store = useMailingListsStore()

const listId = computed(() => route.params.id as string)
const statusFilter = ref('all')

const editForm = reactive({
  name: '',
  description: '',
  confirmationEmailSubject: '',
  confirmationSuccessUrl: '',
})

onMounted(async () => {
  await store.fetchList(listId.value)
  syncEditForm()
  await loadSubscribers()
})

watch(statusFilter, () => loadSubscribers())

function syncEditForm() {
  if (store.currentList) {
    editForm.name = store.currentList.name
    editForm.description = store.currentList.description ?? ''
    editForm.confirmationEmailSubject = store.currentList.confirmationEmailSubject ?? ''
    editForm.confirmationSuccessUrl = store.currentList.confirmationSuccessUrl ?? ''
  }
}

async function loadSubscribers() {
  await store.fetchSubscribers(
    listId.value,
    statusFilter.value === 'all' ? undefined : statusFilter.value,
  )
}

async function removeSubscriber(subscriberId: string) {
  if (!confirm('Remove this subscriber?')) return
  await store.removeSubscriber(listId.value, subscriberId)
}

async function updateList() {
  await store.updateList(listId.value, {
    name: editForm.name || undefined,
    description: editForm.description || undefined,
    confirmationEmailSubject: editForm.confirmationEmailSubject || undefined,
    confirmationSuccessUrl: editForm.confirmationSuccessUrl || undefined,
  })
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString()
}
</script>

<style lang="scss" scoped>
.mailing-list-detail {
  display: grid;
  gap: 1.5rem;

  &__header {
    h2 { margin: 0.5rem 0 0; }
    p { margin: 0.25rem 0 0; color: var(--pietru-color-text-muted); font-size: 0.85rem; }
  }

  &__back {
    color: var(--pietru-color-text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    &:hover { color: var(--pietru-color-text); }
  }

  &__stats {
    display: flex;
    gap: 1rem;
  }

  &__stat {
    flex: 1;
    padding: 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);
    text-align: center;

    strong { display: block; font-size: 1.5rem; }
    span { font-size: 0.8rem; color: var(--pietru-color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  }

  &__panel {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
  }

  &__panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;

    h3 { margin: 0; }
  }

  &__filters {
    display: flex;
    gap: 0.5rem;

    button {
      padding: 0.35rem 0.7rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: transparent;
      color: var(--pietru-color-text-muted);
      font-size: 0.8rem;
      cursor: pointer;
      text-transform: capitalize;

      &[data-active="true"] {
        background: var(--pietru-color-border);
        color: var(--pietru-color-text);
      }
    }
  }

  &__empty {
    padding: 1.5rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;

    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--pietru-color-panel-strong);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);

      strong { font-size: 0.9rem; }
      p { margin: 0.15rem 0 0; font-size: 0.8rem; color: var(--pietru-color-text-muted); }

      > button {
        padding: 0.35rem 0.6rem;
        border: 1px solid var(--pietru-color-border);
        border-radius: var(--pietru-radius-sm);
        background: transparent;
        color: var(--pietru-color-text-muted);
        font-size: 0.75rem;
        cursor: pointer;
        white-space: nowrap;

        &:hover { border-color: #e53e3e; color: #e53e3e; }
      }
    }
  }

  &__status {
    display: inline-block;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;

    &--confirmed { background: #c6f6d5; color: #22543d; }
    &--pending { background: #fefcbf; color: #744210; }
    &--unsubscribed { background: #fed7d7; color: #742a2a; }
  }

  &__meta {
    font-family: monospace;
    font-size: 0.75rem !important;
    color: var(--pietru-color-text-muted);
  }

  &__more {
    text-align: center;
    font-size: 0.85rem;
    color: var(--pietru-color-text-muted);
  }

  &__settings {
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);

    summary {
      padding: 0.75rem 1rem;
      cursor: pointer;
      font-weight: 500;
      color: var(--pietru-color-text-muted);
    }
  }

  &__settings-form {
    display: grid;
    gap: 0.75rem;
    padding: 0 1rem 1rem;

    label {
      display: grid;
      gap: 0.25rem;
      font-size: 0.85rem;
    }

    input {
      padding: 0.5rem 0.7rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);
      color: var(--pietru-color-text);
      &:focus { outline: none; border-color: var(--pietru-color-accent); }
    }

    > button {
      justify-self: start;
      padding: 0.5rem 1rem;
      border: 1px solid var(--pietru-color-accent);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-accent);
      color: var(--pietru-color-background);
      font-weight: 500;
      cursor: pointer;
    }
  }

  &__error { color: #e53e3e; font-size: 0.85rem; }
}
</style>
