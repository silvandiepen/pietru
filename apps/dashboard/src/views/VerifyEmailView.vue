<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>Verify email</h1>
      <label>
        <span>Verification token</span>
        <input v-model="token" type="text" required />
      </label>
      <p v-if="verified">Email verified.</p>
      <button type="submit">Verify email</button>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const token = ref('')
const verified = ref(false)

async function submit() {
  await authStore.verifyEmail(token.value)
  verified.value = true
}
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
