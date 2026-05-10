<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="handleVerify">
      <h1>{{ $t('auth.verifyEmail.title') }}</h1>
      <template v-if="!verified && !loading && !error">
        <label v-if="!tokenFromUrl">
          <span>{{ $t('auth.verifyEmail.labelToken') }}</span>
          <input v-model="token" type="text" required />
        </label>
        <p v-else>
          {{ $t('auth.verifyEmail.verifyingMessage') }}
        </p>
        <button v-if="!tokenFromUrl" type="submit">{{ $t('auth.verifyEmail.buttonSubmit') }}</button>
      </template>
      <p v-if="loading">{{ $t('auth.verifyEmail.verifying') }}</p>
      <p v-if="error" class="auth-view__error">{{ error }}</p>
      <p v-if="verified">{{ $t('auth.verifyEmail.success') }} <router-link to="/">{{ $t('auth.verifyEmail.goToDashboard') }}</router-link></p>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'lezu-i18n/vue'

const authStore = useAuthStore()
const route = useRoute()
const { t } = useI18n()
const token = ref('')
const verified = ref(false)
const loading = ref(false)
const error = ref('')

const tokenFromUrl = (route.query.token as string) || null

async function handleVerify() {
  const tVal = tokenFromUrl || token.value
  if (!tVal) return
  loading.value = true
  error.value = ''
  try {
    await authStore.verifyEmail(tVal)
    verified.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('auth.verifyEmail.fallbackError')
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
