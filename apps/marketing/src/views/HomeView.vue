<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'lezu-i18n/vue'
import { Icon, Icons, Button, Section, Badge, Steps, Colors } from '@sil/ui'
import logoIcon from '@/assets/logo-icon-pietru.svg'
import logoWordmark from '@/assets/logo-wordmark.svg'

const { t } = useI18n()

const dashboardUrl =
  import.meta.env.VITE_PIETRU_DASHBOARD_URL || 'https://app.pietru.dev'

// Scroll-based parallax
const scrollY = ref(0)
const heroOffset = ref(0)
const mockupOffset = ref(0)
const heroOpacity = ref(1)

function onScroll() {
  scrollY.value = window.scrollY
  const heroHeight = window.innerHeight * 0.8
  const progress = Math.min(scrollY.value / heroHeight, 1)

  heroOffset.value = scrollY.value * 0.25
  heroOpacity.value = 1 - progress * 0.5

  // Mockup rises up into view, then settles
  if (scrollY.value < heroHeight * 0.6) {
    mockupOffset.value = scrollY.value * 0.4
  } else {
    mockupOffset.value = heroHeight * 0.24
  }
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))

const featureKeys = ['send', 'capture', 'receive', 'track', 'debug', 'switch'] as const

const featureIcons: Record<string, string> = {
  send: Icons.MEDIA_MAIL,
  capture: Icons.UI_CIRCLED_VISIBLE,
  receive: Icons.ARROWS_ARROW_HEADED_DOWNLOAD,
  track: Icons.UI_ON_TARGET,
  debug: Icons.UI_CODE_BRACKETS,
  switch: Icons.ARROWS_ARROW_TRANSFER_LEFT_RIGHT,
}

const features = featureKeys.map((key) => ({
  key,
  title: t(`home.features.${key}.title`),
  desc: t(`home.features.${key}.desc`),
  icon: featureIcons[key],
}))

const howItWorksSteps = [
  {
    title: t('home.howItWorks.step1.title'),
    description: t('home.howItWorks.step1.desc'),
  },
  {
    title: t('home.howItWorks.step2.title'),
    description: t('home.howItWorks.step2.desc'),
  },
  {
    title: t('home.howItWorks.step3.title'),
    description: t('home.howItWorks.step3.desc'),
  },
]

const envKeys = ['dev', 'staging', 'prod', 'ops'] as const

const envIcons: Record<string, string> = {
  dev: Icons.UI_CODE_BRACKETS,
  staging: Icons.UI_LAYERS_2,
  prod: Icons.MEDIA_MAIL,
  ops: Icons.UI_ON_TARGET,
}

const environments = envKeys.map((key) => ({
  key,
  title: t(`home.environments.${key}.title`),
  desc: t(`home.environments.${key}.desc`),
  icon: envIcons[key],
}))
</script>

<template>
  <div class="home">
    <!-- Hero — 80vh, 50/50: coral left panel + content right -->
    <div class="hero">
      <div class="hero__inner">
        <div
          class="hero__panel"
          :style="{ transform: `translateY(${heroOffset}px)`, opacity: heroOpacity }"
        >
          <div class="hero__logo">
            <img :src="logoIcon" alt="" aria-hidden="true" class="hero__logo-icon" />
            <img :src="logoWordmark" alt="Pietru" class="hero__logo-wordmark" />
          </div>
        </div>

        <div
          class="hero__content"
          :style="{ transform: `translateY(${heroOffset * 0.5}px)`, opacity: heroOpacity }"
        >
          <Badge variant="primary" size="small">{{ $t('home.eyebrow') }}</Badge>
          <h1 class="marketing-title marketing-title--hero">
            {{ $t('home.heroHeading') }}
          </h1>
          <p class="marketing-subtitle" style="margin-inline: 0;">{{ $t('home.heroSummary') }}</p>
          <div class="marketing-actions" style="justify-content: flex-start;">
            <Button variant="primary" :href="dashboardUrl" target="_blank">
              {{ $t('home.getStarted') }} →
            </Button>
            <Button variant="ghost" :to="'/features'">
              {{ $t('home.seeHowItWorks') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard preview — overlaps hero with negative margin -->
    <Section centered class="mockup-section">
      <div
        class="mockup-wrapper"
        :style="{ transform: `translateY(${mockupOffset}px)` }"
      >
        <div class="dashboard-mockup">
          <div class="dashboard-mockup__inner">
            <div class="dashboard-mockup__chrome">
              <span class="dashboard-mockup__dot dashboard-mockup__dot--red" />
              <span class="dashboard-mockup__dot dashboard-mockup__dot--yellow" />
              <span class="dashboard-mockup__dot dashboard-mockup__dot--green" />
              <span class="dashboard-mockup__url">app.pietru.dev</span>
            </div>
            <div style="display: grid; grid-template-columns: 5rem 1fr;">
              <div class="dashboard-mockup__sidebar">
                <div class="dashboard-mockup__sidebar-item dashboard-mockup__sidebar-item--active">● Dashboard</div>
                <div class="dashboard-mockup__sidebar-item">● Messages</div>
                <div class="dashboard-mockup__sidebar-item">● Inboxes</div>
                <div class="dashboard-mockup__sidebar-item">● Settings</div>
              </div>
              <div class="dashboard-mockup__content">
                <div class="dashboard-mockup__stats">
                  <div class="dashboard-mockup__stat">
                    <span class="dashboard-mockup__stat-value">1,247</span>
                    <span class="dashboard-mockup__stat-label">Sent</span>
                  </div>
                  <div class="dashboard-mockup__stat">
                    <span class="dashboard-mockup__stat-value">1,189</span>
                    <span class="dashboard-mockup__stat-label">Delivered</span>
                  </div>
                  <div class="dashboard-mockup__stat">
                    <span class="dashboard-mockup__stat-value">3</span>
                    <span class="dashboard-mockup__stat-label">Failed</span>
                  </div>
                  <div class="dashboard-mockup__stat">
                    <span class="dashboard-mockup__stat-value">42</span>
                    <span class="dashboard-mockup__stat-label">Captured</span>
                  </div>
                </div>
                <table class="dashboard-mockup__table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Subject</th>
                      <th>To</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span class="dashboard-mockup__badge dashboard-mockup__badge--success">Delivered</span></td>
                      <td>Welcome to MyApp</td>
                      <td>user@example.com</td>
                      <td>2m ago</td>
                    </tr>
                    <tr>
                      <td><span class="dashboard-mockup__badge dashboard-mockup__badge--success">Delivered</span></td>
                      <td>Password Reset</td>
                      <td>alice@test.com</td>
                      <td>5m ago</td>
                    </tr>
                    <tr>
                      <td><span class="dashboard-mockup__badge dashboard-mockup__badge--info">Captured</span></td>
                      <td>Verify your email</td>
                      <td>test+1@pietru.dev</td>
                      <td>8m ago</td>
                    </tr>
                    <tr>
                      <td><span class="dashboard-mockup__badge dashboard-mockup__badge--error">Failed</span></td>
                      <td>Invoice #1042</td>
                      <td>bob@company.io</td>
                      <td>12m ago</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>

    <!-- How It Works -->
    <Section variant="alternate" class="marketing-section marketing-section-dark">
      <div class="marketing-content">
        <div class="marketing-header marketing-header--center">
          <Badge variant="primary" size="small">{{ $t('home.howItWorks.eyebrow') }}</Badge>
          <h2 class="marketing-title" style="margin-top: 0.75rem;">{{ $t('home.howItWorks.title') }}</h2>
        </div>
        <div class="how-steps-wrapper">
          <Steps
            :steps="howItWorksSteps"
            direction="horizontal"
            :current-step="1"
          />
        </div>
      </div>
    </Section>

    <!-- Built for every environment -->
    <Section class="marketing-section">
      <div class="marketing-content">
        <div class="marketing-header marketing-header--center">
          <Badge variant="outline" size="small">Environments</Badge>
          <h2 class="marketing-title marketing-title--hero" style="font-size: clamp(1.5rem, 3vw, 2.25rem); margin-top: 0.75rem;">
            Built for every environment
          </h2>
          <p class="marketing-subtitle">
            From local development to production operations — one email gateway for your entire workflow.
          </p>
        </div>
        <div class="environment-grid">
          <article v-for="env in environments" :key="env.key" class="environment-item">
            <div class="environment-item__icon">
              <Icon :name="env.icon" size="medium" />
            </div>
            <h3 class="environment-item__title">{{ env.title }}</h3>
            <p class="environment-item__desc">{{ env.desc }}</p>
          </article>
        </div>
      </div>
    </Section>

    <!-- Features -->
    <Section class="marketing-section marketing-section--tight">
      <div class="marketing-content">
        <div class="marketing-header marketing-header--center">
          <Badge variant="outline" size="small">{{ $t('home.features.sectionHeading') }}</Badge>
          <h2 class="marketing-title" style="margin-top: 0.75rem;">Two problems, one dashboard</h2>
        </div>
        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.key" class="feature-item">
            <div class="feature-item__icon">
              <Icon :name="feature.icon" size="medium" color="primary" />
            </div>
            <h3 class="feature-item__title">{{ feature.title }}</h3>
            <p class="feature-item__desc">{{ feature.desc }}</p>
          </article>
        </div>
      </div>
    </Section>

    <!-- CTA -->
    <Section variant="cta" centered class="marketing-section marketing-cta-section">
      <h2 class="marketing-title">{{ $t('home.cta.heading') }}</h2>
      <p class="marketing-subtitle">{{ $t('home.cta.summary') }}</p>
      <div class="marketing-actions">
        <Button
          variant="default"
          :color="Colors.DARK"
          :href="dashboardUrl"
          target="_blank"
        >
          {{ $t('home.cta.button') }} →
        </Button>
      </div>
    </Section>
  </div>
</template>

<style lang="scss">
.how-steps-wrapper {
  max-width: 48rem;
  margin-inline: auto;
}

@media (max-width: 56em) {
  .how-steps-wrapper {
    .steps {
      &[data-direction="horizontal"] {
        .steps__step {
          flex-direction: row;
          align-items: flex-start;
          text-align: left;
        }

        .steps__indicator {
          flex-direction: column;
          align-items: center;
          width: auto;
        }

        .steps__connector {
          height: auto;
          width: 2px;
          flex: 1;
          min-height: var(--space);
          margin: var(--space-xs) 0;
        }

        .steps__content {
          text-align: left;
          padding-top: 0;
          padding-left: var(--space);
          padding-bottom: var(--space-l);
        }
      }
    }
  }
}
</style>
