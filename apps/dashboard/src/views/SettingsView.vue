<template>
  <AppLayout
    project-name="Settings"
    environment="dev"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="settings-view">
      <article class="settings-view__panel">
        <h2>Profile</h2>
        <p>{{ authStore.user?.email }}</p>
      </article>

      <article class="settings-view__panel">
        <h2>Change password</h2>
        <form class="settings-view__form" @submit.prevent="submitPasswordChange">
          <input v-model="passwordForm.currentPassword" type="password" placeholder="Current password" />
          <input v-model="passwordForm.newPassword" type="password" placeholder="New password" />
          <button type="submit">Update password</button>
        </form>
      </article>

      <article class="settings-view__panel">
        <h2>Active sessions</h2>
        <ul class="settings-view__sessions">
          <SessionRow
            v-for="session in authStore.sessions"
            :key="session.id"
            :session="session"
            @revoke="authStore.revokeSession"
          />
        </ul>
      </article>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import SessionRow from '@/components/SessionRow'
import { useAuthStore } from '@/stores/auth'
import { useProjectsStore } from '@/stores/projects'

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const router = useRouter()

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
})

onMounted(async () => {
  await Promise.all([projectsStore.list(), authStore.loadSessions()])
})

async function submitPasswordChange() {
  await authStore.changePassword(passwordForm)
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
}

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}`)
}
</script>

<style lang="scss" scoped>
.settings-view {
  display: grid;
  gap: 1rem;

  &__panel {
    display: grid;
    gap: 1rem;
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
  }

  &__form,
  &__sessions {
    display: grid;
    gap: 0.75rem;
  }

  &__sessions {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  input,
  button {
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
  }

  button {
    background: var(--pietru-color-accent);
    color: white;
    border-color: var(--pietru-color-accent);
  }
}
</style>
