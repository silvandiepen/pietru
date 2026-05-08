<template>
  <div class="home-view">
    <header class="home-view__header">
      <RouterLink to="/" class="home-view__brand">Pietru</RouterLink>
      <nav class="home-view__nav">
        <RouterLink to="/features">Features</RouterLink>
        <a :href="dashboardUrl">Open dashboard</a>
      </nav>
    </header>

    <main class="home-view__main">
      <section class="home-view__hero">
        <p class="home-view__eyebrow">One API for every app that sends email</p>
        <h1>Centralize delivery, capture, debugging, and routing without scattering email logic.</h1>
        <p class="home-view__summary">
          Pietru gives product teams one Cloudflare-native mail gateway for transactional sends, test inboxes,
          event tracing, and provider controls.
        </p>
        <div class="home-view__cta">
          <a :href="dashboardUrl">Launch dashboard</a>
          <RouterLink to="/features">Explore features</RouterLink>
        </div>
      </section>

      <section class="home-view__features">
        <article v-for="feature in features" :key="feature.title" class="home-view__feature-card">
          <h2>{{ feature.title }}</h2>
          <p>{{ feature.description }}</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
const dashboardUrl = import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://8f26d547.pietru-dashboard.pages.dev'

const features = [
  { title: 'Send', description: 'Ship transactional email through a stable project API with environment-aware keys.' },
  { title: 'Capture', description: 'Route non-production mail into test inboxes instead of real recipients.' },
  { title: 'Debug', description: 'Inspect full payloads, provider failures, and rendered HTML for every message.' },
  { title: 'Track', description: 'Review delivery lifecycle events in one timeline per message.' },
  { title: 'Route', description: 'Swap provider modes and sender policy without touching each application.' },
]
</script>

<style lang="scss" scoped>
.home-view {
  min-height: 100vh;
  padding: 1.5rem;

  &__header,
  &__nav,
  &__cta {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  &__header {
    justify-content: space-between;
    max-width: 72rem;
    margin: 0 auto;
  }

  &__brand {
    font-size: 1.15rem;
    font-weight: 700;
    text-decoration: none;
  }

  &__main {
    max-width: 72rem;
    margin: 0 auto;
    padding: 5rem 0 3rem;
    display: grid;
    gap: 3rem;
  }

  &__hero {
    max-width: 48rem;
    display: grid;
    gap: 1.25rem;

    h1 {
      margin: 0;
      font-size: clamp(2.8rem, 7vw, 5rem);
      line-height: 0.96;
      letter-spacing: -0.04em;
    }
  }

  &__eyebrow,
  &__summary {
    color: var(--pietru-color-text-muted);
    margin: 0;
  }

  &__cta a,
  &__nav a {
    text-decoration: none;
  }

  &__cta a {
    padding: 0.85rem 1.05rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: 999px;
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);

    &:first-child {
      border-color: var(--pietru-color-accent);
      background: var(--pietru-color-accent);
      color: white;
    }
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1rem;
  }

  &__feature-card {
    padding: 1.25rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-panel);
    box-shadow: var(--pietru-shadow-panel);

    h2 {
      margin-top: 0;
    }

    p {
      color: var(--pietru-color-text-muted);
      margin-bottom: 0;
    }
  }
}

@media (max-width: 980px) {
  .home-view__features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .home-view {
    &__header,
    &__nav,
    &__cta {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  .home-view__features {
    grid-template-columns: 1fr;
  }
}
</style>
