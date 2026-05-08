<template>
  <div class="features-view">
    <header class="features-view__header">
      <RouterLink to="/" class="features-view__brand">Pietru</RouterLink>
      <nav class="features-view__nav">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/features">Features</RouterLink>
        <a :href="dashboardUrl">Open dashboard</a>
      </nav>
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
  background: var(--pietru-color-background);
  color: var(--pietru-color-foreground);

  &__header,
  &__nav {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    width: min(100%, 75rem);
    margin: 0 auto;
    justify-content: space-between;
    padding: 1.25rem clamp(1rem, 6vw, 8rem);
    background: rgba(2, 11, 34, 0.92);
    border-bottom: 1px solid var(--pietru-color-border);
    backdrop-filter: blur(12px);
  }

  &__brand {
    color: var(--pietru-color-foreground);
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    text-decoration: none;
  }

  &__main {
    width: min(100%, 75rem);
    margin: 0 auto;
    padding: 4rem clamp(1rem, 6vw, 8rem) 6rem;
    display: grid;
    gap: 1.25rem;
  }

  &__nav a {
    color: var(--pietru-color-foreground);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--pietru-color-text-muted);
    }
  }

  &__section {
    padding: 1.75rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);

    h1 {
      margin: 0 0 0.75rem;
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 600;
      line-height: 1.1;
      letter-spacing: -0.02em;
      color: var(--pietru-color-foreground);
    }

    p {
      margin-bottom: 0;
      color: var(--pietru-color-text-muted);
    }
  }
}

@media (max-width: 640px) {
  .features-view {
    &__header,
    &__nav {
      flex-direction: column;
      align-items: flex-start;
    }

    &__header {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }
  }
}
</style>
