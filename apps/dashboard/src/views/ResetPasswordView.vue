<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>Choose a new password</h1>
      <label>
        <span>Reset token</span>
        <input v-model="form.token" type="text" required />
      </label>
      <label>
        <span>New password</span>
        <input v-model="form.password" type="password" required />
      </label>
      <p v-if="submitted">Password updated. You can log in now.</p>
      <button type="submit">Update password</button>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const submitted = ref(false)
const form = reactive({
  token: '',
  password: '',
})

async function submit() {
  await authStore.resetPassword(form)
  submitted.value = true
}
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
