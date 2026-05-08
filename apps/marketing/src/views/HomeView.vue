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

    <footer class="home-view__footer">
      <p>© 2026 Pietru. Built for teams that ship email-heavy products.</p>
    </footer>
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
  background: var(--pietru-color-background);
  color: var(--pietru-color-foreground);

  &__header,
  &__nav,
  &__cta {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    justify-content: space-between;
    width: min(100%, 75rem);
    margin: 0 auto;
    padding: 1.25rem clamp(1rem, 6vw, 8rem);
    background: rgba(2, 11, 34, 0.92);
    border-bottom: 1px solid var(--pietru-color-border);
    backdrop-filter: blur(12px);
  }

  &__brand {
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.02em;
    text-decoration: none;
    color: var(--pietru-color-foreground);
  }

  &__main {
    width: min(100%, 75rem);
    margin: 0 auto;
    padding: 4rem clamp(1rem, 6vw, 8rem) 6rem;
    display: grid;
    gap: 5rem;
  }

  &__hero {
    max-width: 48rem;
    display: grid;
    gap: 1.5rem;

    h1 {
      margin: 0;
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 600;
      line-height: 1.02;
      letter-spacing: -0.02em;
    }
  }

  &__eyebrow,
  &__summary {
    color: var(--pietru-color-text-muted);
    margin: 0;
  }

  &__eyebrow {
    font-size: 0.95rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  &__summary {
    max-width: 42rem;
  }

  &__cta a,
  &__nav a {
    text-decoration: none;
    transition:
      color 0.2s ease,
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  &__nav a {
    color: var(--pietru-color-foreground);

    &:hover {
      color: var(--pietru-color-text-muted);
    }
  }

  &__cta a {
    padding: 0.7rem 1.2rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-pill);
    background: transparent;
    color: var(--pietru-color-foreground);
    font-weight: 500;

    &:first-child {
      border-color: var(--pietru-color-accent);
      background: var(--pietru-color-accent);
      color: var(--pietru-color-background);

      &:hover {
        background: var(--pietru-color-accent-hover);
        border-color: var(--pietru-color-accent-hover);
      }
    }

    &:last-child {
      border-color: rgba(255, 255, 255, 0.12);

      &:hover {
        border-color: rgba(255, 255, 255, 0.24);
        color: var(--pietru-color-foreground);
      }
    }
  }

  &__features {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.25rem;
  }

  &__feature-card {
    padding: 1.5rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-lg);
    background: var(--pietru-color-surface);
    box-shadow: var(--pietru-shadow-panel);

    h2 {
      margin: 0 0 0.75rem;
      color: var(--pietru-color-foreground);
      font-size: clamp(1.15rem, 2vw, 1.35rem);
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    p {
      color: var(--pietru-color-text-muted);
      margin-bottom: 0;
    }
  }

  &__footer {
    width: min(100%, 75rem);
    margin: 0 auto;
    padding: 0 clamp(1rem, 6vw, 8rem) 2rem;

    p {
      margin: 0;
      padding-top: 1.5rem;
      border-top: 1px solid var(--pietru-color-border);
      color: var(--pietru-color-text-muted);
      font-size: 0.95rem;
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

    &__header {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    &__main {
      padding-top: 3rem;
      gap: 4rem;
    }
  }

  .home-view__features {
    grid-template-columns: 1fr;
  }
}
</style>
