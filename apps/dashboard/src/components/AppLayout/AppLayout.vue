<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <strong>Pietru</strong>
        <span>Mail gateway</span>
      </div>

      <ProjectSwitcher
        :model-value="activeProjectId"
        :projects="projects"
        @update:model-value="$emit('project-change', $event)"
      />

      <nav class="app-layout__nav">
        <RouterLink class="app-layout__nav-link" to="/">Projects</RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}`"
        >
          Project detail
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/messages`"
        >
          Messages
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/test-inboxes`"
        >
          Test inboxes
        </RouterLink>
        <RouterLink class="app-layout__nav-link" to="/settings">Settings</RouterLink>
      </nav>
    </aside>

    <div class="app-layout__content">
      <header class="app-layout__topbar">
        <div>
          <h1>{{ projectName || 'Dashboard' }}</h1>
          <p>Authenticated mail gateway dashboard</p>
        </div>
        <EnvironmentBadge :environment="environment" />
      </header>

      <main class="app-layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import EnvironmentBadge from '@/components/EnvironmentBadge'
import ProjectSwitcher from '@/components/ProjectSwitcher'

import type { AppLayoutProps } from './AppLayout.model'

defineProps<AppLayoutProps>()

defineEmits<{
  'project-change': [projectId: string]
}>()
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr);

  &__sidebar {
    display: grid;
    align-content: start;
    gap: 1.5rem;
    padding: 1.5rem;
    border-right: 1px solid var(--pietru-color-border);
    background: var(--pietru-color-surface-sidebar);
  }

  &__brand {
    display: grid;
    gap: 0.2rem;
    color: var(--pietru-color-text);

    strong {
      font-size: 1.2rem;
      font-weight: 600;
    }

    span {
      color: var(--pietru-color-text-muted);
    }
  }

  &__nav {
    display: grid;
    gap: 0.35rem;
  }

  &__nav-link {
    padding: 0.75rem 0.9rem;
    border-radius: var(--pietru-radius-sm);
    text-decoration: none;
    color: var(--pietru-color-text-muted);
    transition: background-color 160ms ease, color 160ms ease;

    &:hover {
      background: var(--pietru-color-border);
      color: var(--pietru-color-text);
    }

    &.router-link-active {
      background: var(--pietru-color-border);
      color: var(--pietru-color-text);
    }
  }

  &__content {
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--pietru-color-background);
  }

  &__topbar {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid var(--pietru-color-border);

    h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 600;
    }

    p {
      margin: 0.35rem 0 0;
      color: var(--pietru-color-text-muted);
    }
  }

  &__main {
    padding: 0 2rem 2rem;
  }
}

@media (max-width: 920px) {
  .app-layout {
    grid-template-columns: 1fr;

    &__sidebar {
      border-right: 0;
      border-bottom: 1px solid var(--pietru-color-border);
    }
  }
}
</style>
