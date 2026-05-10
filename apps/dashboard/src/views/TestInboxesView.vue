<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name"
    :environment="projectsStore.activeProject?.environment || 'dev'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="test-inboxes-view">
      <header>
        <h2>{{ $t('testInboxes.title') }}</h2>
        <p>{{ $t('testInboxes.description') }}</p>
      </header>

      <ul>
        <li v-for="inbox in inboxes" :key="inbox">
          <RouterLink :to="`/projects/${projectId}/test-inboxes/${inbox}`">{{ inbox }}</RouterLink>
        </li>
      </ul>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()

const projectId = computed(() => route.params.id as string)
const inboxes = computed(() => [
  `${projectsStore.activeProject?.slug || 'project'}-dev`,
  `${projectsStore.activeProject?.slug || 'project'}-preview`,
])

onMounted(async () => {
  await projectsStore.list()
  projectsStore.setActiveProject(projectId.value)
})

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}/test-inboxes`)
}
</script>

<style lang="scss" scoped>
.test-inboxes-view {
  display: grid;
  gap: 1rem;

  ul {
    list-style: none;
    display: grid;
    gap: 0.75rem;
    padding: 0;
  }

  li a {
    display: block;
    padding: 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);
    text-decoration: none;
  }
}
</style>
