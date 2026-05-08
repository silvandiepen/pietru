<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name || 'Dashboard'"
    :environment="projectsStore.activeProject?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="dashboard-view">
      <div class="dashboard-view__header">
        <div>
          <h2>Projects</h2>
          <p>Manage mail gateway projects and jump into delivery detail.</p>
        </div>
        <button type="button" @click="showCreate = !showCreate">
          {{ showCreate ? 'Cancel' : 'New project' }}
        </button>
      </div>

      <form v-if="showCreate" class="dashboard-view__create" @submit.prevent="createProject">
        <input v-model="createForm.name" type="text" placeholder="Project name" required />
        <input v-model="createForm.slug" type="text" placeholder="project-slug" required />
        <button type="submit">Create</button>
      </form>

      <div class="dashboard-view__grid">
        <article v-for="project in projectsStore.items" :key="project.id" class="dashboard-view__card">
          <h3>{{ project.name }}</h3>
          <p>{{ project.slug }}</p>
          <div class="dashboard-view__actions">
            <RouterLink :to="`/projects/${project.id}`">Open</RouterLink>
            <RouterLink :to="`/projects/${project.id}/messages`">Messages</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useProjectsStore } from '@/stores/projects'

const projectsStore = useProjectsStore()
const router = useRouter()
const showCreate = ref(false)
const createForm = reactive({
  name: '',
  slug: '',
})

onMounted(async () => {
  await projectsStore.list()
})

async function createProject() {
  const project = await projectsStore.create(createForm)
  showCreate.value = false
  createForm.name = ''
  createForm.slug = ''
  await router.push(`/projects/${project.id}`)
}

async function changeProject(projectId: string) {
  projectsStore.setActiveProject(projectId)
  await router.push(`/projects/${projectId}`)
}
</script>

<style lang="scss" scoped>
.dashboard-view {
  display: grid;
  gap: 1.5rem;

  &__header,
  &__actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
  }

  &__create,
  &__grid {
    display: grid;
    gap: 1rem;
  }

  &__create {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  &__card {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);

    p {
      color: var(--pietru-color-text-muted);
    }
  }

  input,
  button,
  a {
    padding: 0.8rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-surface-sidebar);
    color: var(--pietru-color-text);
    text-decoration: none;
  }

  input {
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
  .dashboard-view__create {
    grid-template-columns: 1fr;
  }
}
</style>
