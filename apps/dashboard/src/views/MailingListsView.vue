<template>
  <AppLayout
    :project-name="''"
    :projects="[]"
    :active-project-id="''"
  >
    <section class="mailing-lists-view">
      <header class="mailing-lists-view__header">
        <div>
          <h2>Mailing Lists</h2>
          <p>Manage your mailing lists and subscribers</p>
        </div>
      </header>

      <div v-if="store.loading && !store.lists.length" class="mailing-lists-view__empty">
        Loading...
      </div>

      <div v-else-if="!store.lists.length" class="mailing-lists-view__empty">
        <p>No mailing lists yet.</p>
        <button type="button" @click="showCreate = true">Create your first list</button>
      </div>

      <template v-else>
        <ul class="mailing-lists-view__list">
          <li v-for="list in store.lists" :key="list.id" class="mailing-lists-view__item">
            <div class="mailing-lists-view__item-info">
              <router-link :to="`/mailing-lists/${list.id}`">
                <strong>{{ list.name }}</strong>
              </router-link>
              <p>{{ list.slug }} · {{ list.projectId }}</p>
              <p v-if="list.description">{{ list.description }}</p>
            </div>
            <div class="mailing-lists-view__item-meta">
              <span class="mailing-lists-view__badge">{{ list.subscriberCount ?? 0 }} subscribers</span>
              <button type="button" class="mailing-lists-view__btn-delete" @click="deleteList(list.id)">Delete</button>
            </div>
          </li>
        </ul>
      </template>

      <button v-if="store.lists.length" type="button" class="mailing-lists-view__create-btn" @click="showCreate = true">
        + New List
      </button>

      <!-- Create dialog -->
      <div v-if="showCreate" class="mailing-lists-view__overlay" @click.self="showCreate = false">
        <form class="mailing-lists-view__form" @submit.prevent="createList">
          <h3>Create Mailing List</h3>

          <label>
            Project
            <select v-model="form.projectId" required>
              <option value="" disabled>Select a project</option>
              <option v-for="project in projectsStore.items" :key="project.id" :value="project.id">
                {{ project.name }}
              </option>
            </select>
          </label>

          <label>
            Name
            <input v-model="form.name" type="text" placeholder="Newsletter" required />
          </label>

          <label>
            Slug <span class="mailing-lists-view__hint">(auto-generated from name)</span>
            <input v-model="form.slug" type="text" placeholder="newsletter" />
          </label>

          <label>
            Description
            <input v-model="form.description" type="text" placeholder="Monthly product updates" />
          </label>

          <label>
            Confirmation email subject
            <input v-model="form.confirmationEmailSubject" type="text" placeholder="Confirm your subscription" />
          </label>

          <label>
            Success redirect URL
            <input v-model="form.confirmationSuccessUrl" type="url" placeholder="https://example.com/thanks" />
          </label>

          <div class="mailing-lists-view__form-actions">
            <button type="button" @click="showCreate = false">Cancel</button>
            <button type="submit" :disabled="creating">{{ creating ? 'Creating...' : 'Create' }}</button>
          </div>

          <p v-if="store.error" class="mailing-lists-view__error">{{ store.error }}</p>
        </form>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'

import AppLayout from '@/components/AppLayout'
import { useMailingListsStore } from '@/stores/mailingLists'
import { useProjectsStore } from '@/stores/projects'

const store = useMailingListsStore()
const projectsStore = useProjectsStore()

const showCreate = ref(false)
const creating = ref(false)

const form = reactive({
  projectId: '',
  name: '',
  slug: '',
  description: '',
  confirmationEmailSubject: '',
  confirmationSuccessUrl: '',
})

onMounted(async () => {
  await Promise.all([store.fetchLists(), projectsStore.list()])
})

async function createList() {
  creating.value = true
  try {
    await store.createList({
      projectId: form.projectId,
      name: form.name,
      slug: form.slug || undefined,
      description: form.description || undefined,
      confirmationEmailSubject: form.confirmationEmailSubject || undefined,
      confirmationSuccessUrl: form.confirmationSuccessUrl || undefined,
    })
    showCreate.value = false
    form.projectId = ''
    form.name = ''
    form.slug = ''
    form.description = ''
    form.confirmationEmailSubject = ''
    form.confirmationSuccessUrl = ''
  } finally {
    creating.value = false
  }
}

async function deleteList(listId: string) {
  if (!confirm('Delete this mailing list and all its subscribers?')) return
  await store.deleteList(listId)
}
</script>

<style lang="scss" scoped>
.mailing-lists-view {
  display: grid;
  gap: 1.5rem;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h2 { margin: 0; }
    p { margin: 0.25rem 0 0; color: var(--pietru-color-text-muted); }
  }

  &__empty {
    padding: 2rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
    border: 1px dashed var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);

    button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--pietru-color-accent);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-accent);
      color: var(--pietru-color-background);
      font-weight: 500;
    }
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  &__item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);

    a {
      text-decoration: none;
      color: var(--pietru-color-text);
      &:hover strong { text-decoration: underline; }
    }

    p { margin: 0.2rem 0 0; color: var(--pietru-color-text-muted); font-size: 0.85rem; }
  }

  &__item-info { flex: 1; }

  &__item-meta {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__badge {
    padding: 0.25rem 0.6rem;
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel-strong);
    font-size: 0.8rem;
    color: var(--pietru-color-text-muted);
  }

  &__btn-delete {
    padding: 0.4rem 0.7rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text-muted);
    font-size: 0.8rem;
    cursor: pointer;

    &:hover { border-color: #e53e3e; color: #e53e3e; }
  }

  &__create-btn {
    justify-self: start;
    padding: 0.6rem 1rem;
    border: 1px solid var(--pietru-color-accent);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-accent);
    color: var(--pietru-color-background);
    font-weight: 500;
    cursor: pointer;
  }

  &__overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--color-background), transparent 30%);
  }

  &__form {
    width: 100%;
    max-width: 480px;
    padding: 1.5rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-background);
    display: grid;
    gap: 1rem;

    h3 { margin: 0; }

    label {
      display: grid;
      gap: 0.3rem;
      font-size: 0.85rem;
      font-weight: 500;
    }

    input, select {
      padding: 0.6rem 0.8rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-surface-sidebar);
      color: var(--pietru-color-text);
      font-size: 0.9rem;

      &:focus { outline: none; border-color: var(--pietru-color-accent); }
    }
  }

  &__hint { font-weight: 400; color: var(--pietru-color-text-muted); font-size: 0.8rem; }

  &__form-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;

    button {
      padding: 0.6rem 1rem;
      border-radius: var(--pietru-radius-sm);
      cursor: pointer;
      font-size: 0.9rem;

      &:first-child {
        border: 1px solid var(--pietru-color-border);
        background: transparent;
        color: var(--pietru-color-text);
      }

      &:last-child {
        border: 1px solid var(--pietru-color-accent);
        background: var(--pietru-color-accent);
        color: var(--pietru-color-background);
        font-weight: 500;

        &:disabled { opacity: 0.5; }
      }
    }
  }

  &__error { color: #e53e3e; font-size: 0.85rem; margin: 0; }
}
</style>
