<script lang="ts" setup>
const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app-pietru.hakobs.com'

const features = [
  {
    num: '01',
    title: 'Send',
    desc: 'Ship transactional email through a stable, versioned project API. Generate environment-specific keys for production, staging, and development.',
  },
  {
    num: '02',
    title: 'Capture',
    desc: 'Intercept non-production mail and route it into private test inboxes. Never accidentally send test emails to real users again.',
  },
  {
    num: '03',
    title: 'Debug',
    desc: 'Inspect full payloads, provider responses, rendered HTML, and error details for every message. Built-in search and filtering.',
  },
  {
    num: '04',
    title: 'Track',
    desc: 'Follow every message through the delivery lifecycle. See accepted, delivered, bounced, and complained events in a unified timeline.',
  },
  {
    num: '05',
    title: 'Route',
    desc: 'Swap provider modes, configure sender policies, and manage routing rules — all from the dashboard without touching application code.',
  },
]
</script>

<template>
  <div class="page">
    <!-- Hero -->
    <section class="hero">
      <div class="container hero__inner">
        <span class="eyebrow">Features</span>
        <h1 class="hero__title">
          Everything you need to control email at scale
        </h1>
        <p class="hero__summary">
          From sending and capturing to debugging and routing — Pietru gives you
          one unified gateway for all your mail.
        </p>
      </div>
    </section>

    <!-- Feature detail sections -->
    <section
      v-for="(feature, i) in features"
      :key="feature.num"
      class="detail"
      :class="i % 2 === 0 ? 'detail--dark' : 'detail--light'"
    >
      <div class="container detail__inner">
        <span class="detail__num">{{ feature.num }}</span>
        <h2 class="detail__title">{{ feature.title }}</h2>
        <p class="detail__desc">{{ feature.desc }}</p>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container cta__inner">
        <h2 class="cta__title">Get started in minutes</h2>
        <a :href="dashboardUrl" class="cta__link">Open Dashboard</a>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
/* ---------- variables ---------- */
$bg-dark: #020b22;
$bg-light: #0a1628;
$text-muted: #8888a0;
$accent: #55c267;

/* ---------- shared ---------- */
.container {
  max-width: 64rem;
  margin-inline: auto;
  padding-inline: clamp(1rem, 6vw, 4rem);
}

/* ---------- hero ---------- */
.hero {
  padding: 6rem 0 4rem;

  &__inner {
    text-align: center;
  }

  .eyebrow {
    display: block;
    text-transform: uppercase;
    font-size: 0.85rem;
    color: $text-muted;
    letter-spacing: 0.08em;
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 600;
    color: #fff;
    margin: 0;
  }

  &__summary {
    color: $text-muted;
    max-width: 36rem;
    margin: 1.25rem auto 0;
    line-height: 1.6;
  }
}

/* ---------- feature detail ---------- */
.detail {
  padding: 5rem 0;

  &--dark {
    background-color: $bg-dark;
  }

  &--light {
    background-color: $bg-light;
  }

  &__inner {
    text-align: center;
  }

  &__num {
    display: block;
    font-size: 0.85rem;
    color: $text-muted;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
  }

  &__title {
    font-size: 1.5rem;
    font-weight: 600;
    color: #fff;
    margin: 0 0 1rem;
  }

  &__desc {
    color: $text-muted;
    max-width: 32rem;
    margin: 0 auto;
    line-height: 1.6;
  }
}

/* ---------- cta ---------- */
.cta {
  padding: 5rem 0;

  &__inner {
    text-align: center;
  }

  &__title {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 600;
    color: #fff;
    margin: 0 0 2rem;
  }

  &__link {
    display: inline-block;
    background-color: $accent;
    color: #fff;
    padding: 0.75rem 2rem;
    border-radius: 999px;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.85;
    }
  }
}
</style>
