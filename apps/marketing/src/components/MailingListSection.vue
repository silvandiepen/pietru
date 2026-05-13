<script setup lang="ts">
import { ref } from 'vue'
import { useBemm } from 'bemm'
import { Button, Section } from '@sil/ui'

const bemm = useBemm('mailing-list-section', { includeBaseClass: true })

const email = ref('')
const status = ref<'idle' | 'submitting' | 'success' | 'error'>('idle')

const apiBaseUrl = (import.meta.env.VITE_PIETRU_API_URL as string | undefined) || 'http://localhost:8787'

function apiUrl(path: string) {
  const base = apiBaseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${base}/v1${normalizedPath}`
}

async function handleSubmit(event: Event) {
  event.preventDefault()
  status.value = 'submitting'

  try {
    const response = await fetch(apiUrl('/mailing-list/subscriptions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        list: 'pietru-updates',
      }),
    })

    if (!response.ok) {
      throw new Error('Subscription failed')
    }

    email.value = ''
    status.value = 'success'
  } catch {
    status.value = 'error'
  }
}
</script>

<template>
  <Section :class="bemm()">
    <div :class="bemm('content')">
      <div :class="bemm('header')">
        <p :class="bemm('eyebrow')">{{ $t('mailingList.eyebrow') }}</p>
        <h2 :class="bemm('title')">{{ $t('mailingList.title') }}</h2>
        <p :class="bemm('summary')">{{ $t('mailingList.summary') }}</p>
      </div>

      <form
        :class="bemm('form')"
        @submit="handleSubmit"
      >
        <label :class="bemm('field')">
          <span :class="bemm('label')">{{ $t('mailingList.emailLabel') }}</span>
          <input
            v-model="email"
            :class="bemm('input')"
            type="email"
            name="email"
            autocomplete="email"
            :placeholder="$t('mailingList.emailPlaceholder')"
            required
          />
        </label>
        <Button type="submit" variant="primary" :disabled="status === 'submitting'">
          {{ status === 'submitting' ? $t('mailingList.buttonSubmitting') : $t('mailingList.button') }}
        </Button>
      </form>

      <p :class="bemm('note')" aria-live="polite">
        {{ $t(`mailingList.status.${status}`) }}
      </p>
    </div>
  </Section>
</template>

<style lang="scss">
.mailing-list-section {
  padding-block: 4.5rem;
  background:
    linear-gradient(180deg, var(--color-background) 0%, var(--color-background-alt) 100%);
  min-height: 0 !important;

  &__content {
    max-width: 62rem;
    margin-inline: auto;
    padding-inline: 2rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(18rem, 24rem);
    align-items: center;
    gap: 2rem;
  }

  &__header {
    max-width: 42rem;
    margin-bottom: 0;
  }

  &__title {
    margin: 0;
    color: var(--color-foreground);
    font-size: clamp(1.45rem, 2.4vw, 1.75rem);
    font-weight: 700;
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  &__summary {
    max-width: 38rem;
    margin: 1rem 0 0;
    color: var(--color-foreground-muted);
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.7;
  }

  &__eyebrow {
    margin: 0 0 0.75rem;
    color: var(--color-primary-accent, #FF3B1F);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  &__form {
    display: flex;
    align-items: end;
    gap: 0.75rem;
  }

  &__field {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.4rem;
  }

  &__label {
    color: var(--color-foreground-muted);
    font-size: 0.8rem;
    font-weight: 600;
  }

  &__input {
    width: 100%;
    min-height: 2.75rem;
    padding: 0.75rem 0.9rem;
    border: 1px solid var(--color-border);
    border-radius: var(--marketing-radius-sm, 0.5rem);
    background: var(--color-background);
    color: var(--color-foreground);
    font: inherit;
    box-shadow: var(--shadow-card);

    &:focus {
      border-color: var(--color-primary-accent, #FF3B1F);
      outline: 3px solid color-mix(in srgb, var(--color-primary-accent, #FF3B1F) 18%, transparent);
      outline-offset: 0;
    }
  }

  &__form .button {
    min-width: 7.25rem;
  }

  &__note {
    grid-column: 2;
    margin: -1.25rem 0 0;
    color: var(--color-foreground-muted);
    font-size: 0.8rem;
    line-height: 1.6;
  }
}

@media (max-width: 56em) {
  .mailing-list-section {
    &__content {
      grid-template-columns: 1fr;
    }

    &__note {
      grid-column: auto;
      margin-top: -0.75rem;
    }
  }
}

@media (max-width: 38em) {
  .mailing-list-section {
    padding-block: 3rem;

    &__content {
      padding-inline: 1.25rem;
    }

    &__form {
      align-items: stretch;
      flex-direction: column;
    }
  }
}
</style>
