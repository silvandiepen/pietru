<template>
  <div class="app-layout">
    <aside class="app-layout__sidebar">
      <div class="app-layout__brand">
        <img class="app-layout__brand-wordmark" src="@/assets/logo-wordmark.svg" alt="Pietru" />
        <span class="app-layout__brand-tagline">Mail gateway</span>
      </div>

      <ProjectSwitcher
        :model-value="activeProjectId"
        :projects="projects"
        @update:model-value="$emit('project-change', $event)"
      />

      <nav class="app-layout__nav">
        <RouterLink class="app-layout__nav-link" to="/">
          <span class="app-layout__nav-icon app-layout__nav-icon--projects">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </span>
          {{ $t('layout.navProjects') }}
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}`"
        >
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </span>
          {{ $t('layout.navProjectDetail') }}
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/messages`"
        >
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </span>
          {{ $t('layout.navMessages') }}
        </RouterLink>
        <RouterLink
          v-if="activeProjectId"
          class="app-layout__nav-link"
          :to="`/projects/${activeProjectId}/test-inboxes`"
        >
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          {{ $t('layout.navTestInboxes') }}
        </RouterLink>
        <RouterLink class="app-layout__nav-link" to="/inbox">
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
          </span>
          {{ $t('layout.navInbox') }}
        </RouterLink>
        <RouterLink class="app-layout__nav-link" to="/settings">
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </span>
          {{ $t('layout.navSettings') }}
        </RouterLink>
        <RouterLink
          v-if="authStore.isAdmin"
          class="app-layout__nav-link"
          to="/admin"
        >
          <span class="app-layout__nav-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          {{ $t('layout.navAdmin') }}
        </RouterLink>
      </nav>

      <div class="app-layout__sidebar-footer">
        <div class="app-layout__mascot">
          <div class="app-layout__mascot-art">
            <div class="app-layout__mascot-body">
              <div class="app-layout__mascot-hat">
                <span class="app-layout__mascot-badge">P</span>
              </div>
              <div class="app-layout__mascot-face">
                <div class="app-layout__mascot-mask"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
  display: grid;
  grid-template-columns: 18rem minmax(0, 1fr);

  &__sidebar {
    display: grid;
    align-content: start;
    gap: 1.5rem;
    padding: 1.5rem;
    border-right: 1px solid var(--pietru-color-border);
    background: var(--pietru-color-surface);
    position: relative;
  }

  &__brand {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  &__brand-wordmark {
    height: 2rem;
    width: auto;
    color: var(--pietru-color-navy);
  }

  &__brand-tagline {
    font-size: 0.8rem;
    color: var(--pietru-color-text-muted);
    letter-spacing: 0.02em;
  }

  &__nav {
    display: grid;
    gap: 0.25rem;
  }

  &__nav-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 0.75rem;
    border-radius: var(--pietru-radius-sm);
    text-decoration: none;
    color: var(--pietru-color-text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    transition: background-color 160ms ease, color 160ms ease;

    &:hover {
      background: var(--pietru-color-cream);
      color: var(--pietru-color-text);
    }

    &.router-link-active {
      background: #fde8e8;
      color: var(--pietru-color-accent);

      .app-layout__nav-icon--projects {
        color: var(--pietru-color-accent);
      }
    }
  }

  &__nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: var(--pietru-color-text-muted);
    transition: color 160ms ease;

    &--projects {
      color: var(--pietru-color-accent);
    }

    .router-link-active & {
      color: var(--pietru-color-accent);
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
      font-weight: 700;
      color: var(--pietru-color-navy);
    }

    p {
      margin: 0.25rem 0 0;
      color: var(--pietru-color-text-muted);
      font-size: 0.9rem;
    }
  }

  &__main {
    padding: 0 2rem 2rem;
  }

  &__sidebar-footer {
    margin-top: auto;
    padding-top: 1rem;
  }

  &__mascot-art {
    width: 100%;
    height: 6rem;
    background: linear-gradient(135deg, #EF4728 0%, #d4351a 100%);
    border-radius: var(--pietru-radius-md);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    overflow: hidden;
  }

  &__mascot-body {
    position: relative;
    width: 4rem;
    height: 5rem;
  }

  &__mascot-hat {
    position: absolute;
    top: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 2.5rem;
    height: 1rem;
    background: var(--pietru-color-navy);
    border-radius: 0.2rem 0.2rem 0 0;

    &::before {
      content: '';
      position: absolute;
      bottom: -0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 3rem;
      height: 0.25rem;
      background: var(--pietru-color-navy);
      border-radius: 0 0 0.1rem 0.1rem;
    }
  }

  &__mascot-badge {
    position: absolute;
    top: 0.15rem;
    left: 50%;
    transform: translateX(-50%);
    width: 0.8rem;
    height: 0.8rem;
    background: #EF4728;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.45rem;
    font-weight: 700;
    color: white;
  }

  &__mascot-face {
    position: absolute;
    bottom: 0.5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 2.2rem;
    height: 2.2rem;
    background: #f5d5c0;
    border-radius: 50%;
  }

  &__mascot-mask {
    position: absolute;
    top: 0.6rem;
    left: 0;
    width: 100%;
    height: 0.5rem;
    background: var(--pietru-color-navy);
    border-radius: 0.3rem;
    opacity: 0.8;
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
