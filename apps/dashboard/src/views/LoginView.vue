<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>Log in</h1>
      <p>Access your projects, mail events, and provider configuration.</p>
      <label>
        <span>Email</span>
        <input v-model="form.email" type="email" required />
      </label>
      <label>
        <span>Password</span>
        <input v-model="form.password" type="password" required />
      </label>
      <p v-if="authStore.error" class="auth-view__error">{{ authStore.error }}</p>
      <button type="submit" :disabled="authStore.loading">Log in</button>
      <RouterLink to="/forgot-password">Forgot password?</RouterLink>
      <RouterLink to="/register">Create account</RouterLink>
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
