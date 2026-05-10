<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>{{ $t('auth.login.title') }}</h1>
      <p>{{ $t('auth.login.description') }}</p>
      <label>
        <span>{{ $t('auth.login.labelEmail') }}</span>
        <input v-model="form.email" type="email" required />
      </label>
      <label>
        <span>{{ $t('auth.login.labelPassword') }}</span>
        <input v-model="form.password" type="password" required />
      </label>
      <p v-if="authStore.error" class="auth-view__error">{{ authStore.error }}</p>
      <button type="submit" :disabled="authStore.loading">{{ $t('auth.login.buttonSubmit') }}</button>
      <RouterLink to="/forgot-password">{{ $t('auth.login.linkForgotPassword') }}</RouterLink>
      <RouterLink to="/register">{{ $t('auth.login.linkCreateAccount') }}</RouterLink>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

async function submit() {
  await authStore.login(form)
  await router.push('/')
}
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
