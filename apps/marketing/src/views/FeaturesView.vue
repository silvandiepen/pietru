<template>
  <div class="features-view">
    <header class="features-view__header">
      <RouterLink to="/">Pietru</RouterLink>
      <a :href="dashboardUrl">Open dashboard</a>
    </header>

    <main class="features-view__main">
      <section v-for="feature in features" :key="feature.title" class="features-view__section">
        <h1>{{ feature.title }}</h1>
        <p>{{ feature.description }}</p>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://8f26d547.pietru-dashboard.pages.dev'

const features = [
  {
    title: 'Send',
    description: 'Issue project-scoped API keys per environment and keep each application on one predictable API contract.',
  },
  {
    title: 'Capture',
    description: 'Capture test traffic in safe inboxes so development and preview environments never leak real email.',
  },
  {
    title: 'Debug',
    description: 'Read metadata, raw errors, text bodies, and rendered HTML in one place when a message misbehaves.',
  },
  {
    title: 'Track',
    description: 'Follow event timelines for queued, sent, delivered, and failed states without stitching together provider dashboards.',
  },
  {
    title: 'Route',
    description: 'Configure providers, default senders, and domain policy centrally for each project environment.',
  },
]
</script>

<style lang="scss" scoped>
.features-view {
  min-height: 100vh;
  padding: 1.5rem;

  &__header {
    max-width: 68rem;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  &__main {
    max-width: 68rem;
    margin: 0 auto;
    padding: 4rem 0 2rem;
    display: grid;
    gap: 1rem;
  }

  &__section {
    padding: 1.5rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);

    h1 {
      margin-top: 0;
      font-size: 1.6rem;
    }

    p {
      margin-bottom: 0;
      color: var(--pietru-color-text-muted);
    }
  }
}

@media (max-width: 640px) {
  .features-view__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
