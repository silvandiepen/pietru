<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <strong>{{ $t('app.brand') }}</strong>
        <span>{{ $t('app.tagline') }}</span>
      </div>

      <ProjectSwitcher
        :model-value="activeProjectId"
        :projects="projects"
        @update:model-value="$emit('project-change', $event)"
      />

      <nav class="app-layout__nav">
        <RouterLink class="app-layout__nav-link" to="/">{{ $t('layout.navProjects') }}</RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}`"
        >
          {{ $t('layout.navProjectDetail') }}
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/messages`"
        >
          {{ $t('layout.navMessages') }}
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/test-inboxes`"
        >
          {{ $t('layout.navTestInboxes') }}
        </RouterLink>
        <RouterLink class="app-layout__nav-link" to="/settings">{{ $t('layout.navSettings') }}</RouterLink>
        <RouterLink
          v-if="authStore.isAdmin"
          class="app-layout__nav-link"
          to="/admin"
        >
          {{ $t('layout.navAdmin') }}
        </RouterLink>
      </nav>
    </aside>

    <div class="app-layout__content">
      <header class="app-layout__topbar">
        <div>
          <h1>{{ projectName || $t('layout.topbarFallback') }}</h1>
          <p>{{ $t('layout.topbarSubtitle') }}</p>
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
import { useAuthStore } from '@/stores/auth'

import type { AppLayoutProps } from './AppLayout.model'

defineProps<AppLayoutProps>()

defineEmits<{
  'project-change': [projectId: string]
}>()

const authStore = useAuthStore()
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
