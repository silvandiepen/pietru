<template>
  <section class="auth-view">
    <form class="auth-view__card" @submit.prevent="submit">
      <h1>{{ $t('auth.resetPassword.title') }}</h1>
      <label v-if="!tokenFromUrl">
        <span>{{ $t('auth.resetPassword.labelResetToken') }}</span>
        <input v-model="form.token" type="text" required />
      </label>
      <label>
        <span>{{ $t('auth.resetPassword.labelNewPassword') }}</span>
        <input v-model="form.password" type="password" required />
      </label>
      <p v-if="submitted">{{ $t('auth.resetPassword.success') }}</p>
      <button type="submit">{{ $t('auth.resetPassword.buttonSubmit') }}</button>
    </form>
  </section>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const submitted = ref(false)
const tokenFromUrl = (route.query.token as string) || null
const form = reactive({
  token: '',
  password: '',
})

async function submit() {
  const token = tokenFromUrl || form.token
  if (!token) return
  await authStore.resetPassword({ token, password: form.password })
  submitted.value = true
}
</script>

<style lang="scss" scoped>
@use '../styles/auth-view';
</style>
