<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="handleVerify">
      <h1>Verify email</h1>
      <template v-if="!verified && !loading && !error">
        <label v-if="!tokenFromUrl">
          <span>Verification token</span>
          <input v-model="token" type="text" required />
        </label>
        <p v-else>
          Verifying your email address...
        </p>
        <button v-if="!tokenFromUrl" type="submit">Verify email</button>
      </template>
      <p v-if="loading">Verifying...</p>
      <p v-if="error" class="auth-view__error">{{ error }}</p>
      <p v-if="verified">Email verified. <router-link to="/">Go to dashboard</router-link></p>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const token = ref('')
const verified = ref(false)
const loading = ref(false)
const error = ref('')

const tokenFromUrl = (route.query.token as string) || null

async function handleVerify() {
  const t = tokenFromUrl || token.value
  if (!t) return
  loading.value = true
  error.value = ''
  try {
    await authStore.verifyEmail(t)
    verified.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Verification failed'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (tokenFromUrl) {
    await handleVerify()
  }
})
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
