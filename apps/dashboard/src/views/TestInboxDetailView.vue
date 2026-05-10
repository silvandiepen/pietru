<template>
  <AppLayout
    :project-name="projectsStore.activeProject?.name"
    :environment="'capture'"
    :projects="projectsStore.items"
    :active-project-id="projectsStore.activeProjectId"
    @project-change="changeProject"
  >
    <section class="test-inbox-detail-view">
      <header>
        <h2>{{ inbox }}</h2>
        <p>{{ $t('testInboxDetail.description') }}</p>
      </header>

      <ul>
        <li v-for="message in inboxMessages" :key="message.id">
          <strong>{{ message.subject }}</strong>
          <span>{{ message.from_address }} → {{ message.to_address }}</span>
        </li>
      </ul>
    </section>
  </AppLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppLayout from '@/components/AppLayout'
import { useMessagesStore } from '@/stores/messages'
import type { InboxMessage } from '@/stores/messages.model'
import { useProjectsStore } from '@/stores/projects'

const route = useRoute()
const router = useRouter()
const projectsStore = useProjectsStore()
const messagesStore = useMessagesStore()

const projectId = computed(() => route.params.id as string)
const inbox = computed(() => route.params.inbox as string)
const inboxMessages = ref<InboxMessage[]>([])

onMounted(async () => {
  await projectsStore.list()
  projectsStore.setActiveProject(projectId.value)
  inboxMessages.value = await messagesStore.listTestInboxMessages(inbox.value)
})

async function changeProject(id: string) {
  projectsStore.setActiveProject(id)
  await router.push(`/projects/${id}/test-inboxes`)
}
</script>

<style lang="scss" scoped>
.test-inbox-detail-view {
  display: grid;
  gap: 1rem;

  ul {
    list-style: none;
    display: grid;
    gap: 0.75rem;
    padding: 0;
  }

  li {
    display: grid;
    gap: 0.25rem;
    padding: 1rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-md);
    background: var(--pietru-color-panel);

    span {
      color: var(--pietru-color-text-muted);
    }
  }
}
</style>
