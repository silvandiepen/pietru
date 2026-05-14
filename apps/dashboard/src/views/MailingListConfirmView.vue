<template>
  <div class="confirm-view">
    <div v-if="loading" class="confirm-view__status">Confirming your subscription...</div>
    <div v-else-if="error" class="confirm-view__status confirm-view__status--error">{{ error }}</div>
    <div v-else-if="redirectUrl" class="confirm-view__status confirm-view__status--success">
      <p>✅ Subscription confirmed!</p>
      <p>Redirecting you...</p>
    </div>
    <div v-else class="confirm-view__status confirm-view__status--success">
      <p>✅ Subscription confirmed!</p>
      <router-link to="/">Back to dashboard</router-link>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { apiRequest } from '@/api/client'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const redirectUrl = ref('')

onMounted(async () => {
  const token = route.query.token as string
  const listId = route.query.list as string

  if (!token || !listId) {
    error.value = 'Invalid confirmation link.'
    loading.value = false
    return
  }

  try {
    const result = await apiRequest<{ ok?: boolean; redirectUrl?: string }>(
      '/mailing-lists/subscribers/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ token, listId }),
      },
    )
    if (result.redirectUrl) {
      redirectUrl.value = result.redirectUrl
      window.location.href = result.redirectUrl
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Confirmation failed.'
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.confirm-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--pietru-color-background);
}

.confirm-view__status {
  text-align: center;
  padding: 2rem;
  border: 1px solid var(--pietru-color-border);
  border-radius: var(--pietru-radius-md);
  background: var(--pietru-color-panel);

  &--error { border-color: #e53e3e; color: #e53e3e; }
  &--success { border-color: #38a169; }

  a { color: var(--pietru-color-accent); }
}
</style>
