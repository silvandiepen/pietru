<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>Reset password</h1>
      <p>We will send you a reset link if the account exists.</p>
      <label>
        <span>Email</span>
        <input v-model="email" type="email" required />
      </label>
      <p v-if="submitted">Check your inbox for a reset link.</p>
      <button type="submit">Send reset link</button>
      <RouterLink to="/login">Back to login</RouterLink>
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
