<template>
  <AppLayout
    project-name="Admin"
    environment="dev"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="admin-view">
      <div class="admin-view__section">
        <h2>Reserved addresses</h2>
        <p class="admin-view__hint">
          Emails sent to these addresses are routed to the admin project.
        </p>

        <form class="admin-view__add-form" @submit.prevent="handleAdd">
          <div class="admin-view__field">
            <label>Address</label>
            <div class="admin-view__input-row">
              <input
                v-model="newLocalPart"
                type="text"
                placeholder="e.g. billing"
                required
                pattern="[a-z0-9][a-z0-9._-]*"
              />
              <span class="admin-view__domain">@pietru.dev</span>
            </div>
          </div>
          <div class="admin-view__field">
            <label>Description</label>
            <input
              v-model="newDescription"
              type="text"
              placeholder="e.g. Billing inquiries"
            />
          </div>
          <button type="submit" :disabled="adding">
            {{ adding ? 'Adding...' : 'Add' }}
          </button>
        </form>
      </div>

      <div v-if="store.loading" class="admin-view__loading">Loading...</div>
      <div v-else-if="store.error" class="admin-view__error">{{ store.error }}</div>
      <div v-else-if="store.items.length === 0" class="admin-view__empty">No reserved addresses.</div>
      <div v-else class="admin-view__section">
        <table class="admin-view__table">
          <thead>
            <tr>
              <th>Address</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in store.items" :key="item.id">
              <td class="admin-view__address">{{ item.local_part }}@pietru.dev</td>
              <td class="admin-view__desc">{{ item.description || '—' }}</td>
              <td>
                <button
                  class="admin-view__toggle"
                  :class="{ 'admin-view__toggle--active': item.is_active }"
                  @click="store.toggle(item.id, !item.is_active)"
                >
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </button>
              </td>
              <td class="admin-view__date">{{ formatDate(item.created_at) }}</td>
              <td>
                <button class="admin-view__delete" @click="handleDelete(item.id, item.local_part)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="admin-view__section">
        <h2>Blocked system names</h2>
        <p class="admin-view__hint">
          These names can never be used as project slugs, in addition to reserved addresses above.
        </p>
        <div class="admin-view__tags">
          <span v-for="name in systemNames" :key="name" class="admin-view__tag">{{ name }}</span>
        </div>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'
import { useReservedAddressesStore } from '@/stores/reservedAddresses'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const store = useReservedAddressesStore()
const router = useRouter()

const systemNames = [
  'admin', 'api', 'app', 'www', 'mail', 'email', 'pietru', 'root',
  'support', 'help', 'noreply', 'no-reply', 'postmaster', 'abuse', 'webmaster', 'localhost',
]

const newLocalPart = ref('')
const newDescription = ref('')
const adding = ref(false)

function changeProject(id: string) {
  projectsStore.setActiveProject(id)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function handleAdd() {
  const localPart = newLocalPart.value.trim().toLowerCase()
  if (!localPart) return

  adding.value = true
  try {
    await store.create(localPart, newDescription.value.trim(), 'proj_admin_system')
    newLocalPart.value = ''
    newDescription.value = ''
  } catch {
    // store handles error
  } finally {
    adding.value = false
  }
}

async function handleDelete(id: string, localPart: string) {
  if (!confirm(`Remove ${localPart}@pietru.dev?`)) return
  await store.remove(id)
}

onMounted(async () => {
  if (!authStore.isAdmin) {
    router.replace('/')
    return
  }
  await store.fetchAll()
})
</script>

<style lang="scss" scoped>
.admin-view {
  display: grid;
  gap: 2rem;

  &__section {
    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.1rem;
      font-weight: 600;
    }
  }

  &__hint {
    margin: 0 0 1rem;
    color: var(--pietru-color-text-muted);
    font-size: 0.85rem;
  }

  &__add-form {
    display: grid;
    grid-template-columns: auto auto auto;
    gap: 0.75rem;
    align-items: end;

    button {
      padding: 0.5rem 1rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: var(--pietru-color-text);
      color: var(--pietru-color-background);
      cursor: pointer;
      font-size: 0.85rem;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  &__field {
    display: grid;
    gap: 0.25rem;

    label {
      font-size: 0.75rem;
      color: var(--pietru-color-text-muted);
    }

    input {
      padding: 0.45rem 0.6rem;
      border: 1px solid var(--pietru-color-border);
      border-radius: var(--pietru-radius-sm);
      background: transparent;
      color: var(--pietru-color-text);
      font-size: 0.85rem;
    }
  }

  &__input-row {
    display: flex;
    align-items: center;
    gap: 0;

    input {
      border-radius: var(--pietru-radius-sm) 0 0 var(--pietru-radius-sm);
      border-right: none;
    }
  }

  &__domain {
    padding: 0.45rem 0.6rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: 0 var(--pietru-radius-sm) var(--pietru-radius-sm) 0;
    background: var(--pietru-color-border);
    color: var(--pietru-color-text-muted);
    font-size: 0.85rem;
    white-space: nowrap;
  }

  &__loading,
  &__error,
  &__empty {
    padding: 2rem;
    text-align: center;
    color: var(--pietru-color-text-muted);
  }

  &__error {
    color: #e74c3c;
  }

  &__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;

    th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--pietru-color-border);
      color: var(--pietru-color-text-muted);
      font-weight: 500;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid var(--pietru-color-border);
    }
  }

  &__address {
    font-family: monospace;
    font-size: 0.85rem;
  }

  &__desc {
    color: var(--pietru-color-text-muted);
  }

  &__date {
    color: var(--pietru-color-text-muted);
    font-size: 0.8rem;
    white-space: nowrap;
  }

  &__toggle {
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: var(--pietru-color-text-muted);
    cursor: pointer;
    font-size: 0.75rem;

    &--active {
      background: #27ae60;
      border-color: #27ae60;
      color: #fff;
    }
  }

  &__delete {
    padding: 0.2rem 0.6rem;
    border: 1px solid transparent;
    border-radius: var(--pietru-radius-sm);
    background: transparent;
    color: #e74c3c;
    cursor: pointer;
    font-size: 0.75rem;

    &:hover {
      border-color: #e74c3c;
    }
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  &__tag {
    padding: 0.2rem 0.55rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    font-size: 0.75rem;
    color: var(--pietru-color-text-muted);
    font-family: monospace;
  }
}

@media (max-width: 700px) {
  .admin-view {
    &__add-form {
      grid-template-columns: 1fr;
    }
  }
}
</style>
