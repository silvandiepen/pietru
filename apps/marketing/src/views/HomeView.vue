<script setup lang="ts">
import { RouterLink } from 'vue-router'

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app-pietru.hakobs.com'

const features = [
  {
    title: 'Send',
    desc: 'Reliable transactional email delivery through a single API endpoint.',
  },
  {
    title: 'Capture',
    desc: 'Intercept and inspect emails in test inboxes during development.',
  },
  {
    title: 'Debug',
    desc: 'Trace every email event with detailed logs and diagnostics.',
  },
  {
    title: 'Track',
    desc: 'Monitor opens, clicks, bounces, and delivery status in real time.',
  },
  {
    title: 'Route',
    desc: 'Control provider routing and failover policies from one place.',
  },
]
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="wrap">
        <p class="eyebrow">One API for every app that sends email</p>
        <h1 class="hero-heading">
          Centralize delivery, capture, debugging, and routing without
          scattering email logic.
        </h1>
        <p class="hero-summary">
          Pietru gives product teams one Cloudflare-native mail gateway for
          transactional sends, test inboxes, event tracing, and provider
          controls.
        </p>
        <div class="cta-row">
          <a :href="dashboardUrl" class="btn btn-primary">Launch Dashboard</a>
          <RouterLink to="/features" class="btn btn-secondary"
            >Explore Features</RouterLink
          >
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="wrap">
        <h2 class="section-heading">Focused tools for every email need</h2>
        <div class="card-grid">
          <div v-for="f in features" :key="f.title" class="card">
            <h3 class="card-title">{{ f.title }}</h3>
            <p class="card-desc">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="wrap">
        <h2 class="section-heading">Ready to centralize your email?</h2>
        <a :href="dashboardUrl" class="btn btn-primary">Launch Dashboard</a>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* ── variables ── */
:root {
  --color-text: #ffffff;
  --color-muted: #8888a0;
  --color-accent: #55c267;
  --color-section-alt: #0a1628;
  --card-bg: rgba(255, 255, 255, 0.02);
  --card-border: rgba(255, 255, 255, 0.06);
  --btn-border: rgba(255, 255, 255, 0.12);
}

/* ── layout helpers ── */
.wrap {
  width: 100%;
  max-width: 64rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 6vw, 4rem);
}

/* ── sections ── */
.hero {
  width: 100%;
  padding: 8rem 0 6rem;
}

.features {
  width: 100%;
  background: var(--color-section-alt);
  padding: 6rem 0;
}

.cta {
  width: 100%;
  padding: 6rem 0;
  text-align: center;
}

/* ── typography ── */
.eyebrow {
  color: var(--color-muted);
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 1.5rem;
}

.hero-heading {
  color: var(--color-text);
  font-size: clamp(2.25rem, 5vw, 3.5rem);
  font-weight: 600;
  line-height: 1.15;
  margin-bottom: 1.5rem;
}

.hero-summary {
  color: var(--color-muted);
  max-width: 36rem;
  line-height: 1.6;
  margin-bottom: 2.5rem;
}

.section-heading {
  color: var(--color-text);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  margin-bottom: 2.5rem;
}

/* ── buttons ── */
.cta-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.75rem;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
}

.btn-primary {
  background: var(--color-accent);
  color: #0d1a0f;
  border: none;
}

.btn-secondary {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--btn-border);
}

/* ── feature cards ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

.card {
  padding: 1.75rem;
  border: 1px solid var(--card-border);
  border-radius: 16px;
  background: var(--card-bg);
}

.card-title {
  color: var(--color-text);
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.card-desc {
  color: var(--color-muted);
  line-height: 1.55;
}

/* ── responsive ── */
@media (max-width: 64em) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 40em) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
