<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>{{ $t('auth.forgotPassword.title') }}</h1>
      <p>{{ $t('auth.forgotPassword.description') }}</p>
      <label>
        <span>{{ $t('auth.forgotPassword.labelEmail') }}</span>
        <input v-model="email" type="email" required />
      </label>
      <p v-if="submitted">{{ $t('auth.forgotPassword.success') }}</p>
      <button type="submit">{{ $t('auth.forgotPassword.buttonSubmit') }}</button>
      <RouterLink to="/login">{{ $t('auth.forgotPassword.linkBackToLogin') }}</RouterLink>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const email = ref('')
const submitted = ref(false)

async function submit() {
  await authStore.forgotPassword(email.value)
  submitted.value = true
}
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
