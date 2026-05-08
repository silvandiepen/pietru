import { defineStore } from 'pinia'

import { ApiError, apiRequest } from '@/api/client'

import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  ChangePasswordPayload,
  ResetPasswordPayload,
} from './auth.model'

interface AuthState {
  user: AuthUser | null
  sessions: AuthSession[]
  initialized: boolean
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    sessions: [],
    initialized: false,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    setError(error: unknown) {
      this.error = error instanceof ApiError ? error.message : 'Unexpected error'
    },
    clearError() {
      this.error = null
    },
    async login(payload: AuthCredentials) {
      this.loading = true
      this.clearError()

      try {
        const response = await apiRequest<{ user: AuthUser }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.user = response.user
        this.initialized = true
        return response.user
      } catch (error) {
        this.setError(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async register(payload: AuthCredentials) {
      this.loading = true
      this.clearError()

      try {
        const response = await apiRequest<{ user: AuthUser }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.user = response.user
        this.initialized = true
        return response.user
      } catch (error) {
        this.setError(error)
        throw error
      } finally {
        this.loading = false
      }
    },
    async logout() {
      await apiRequest('/auth/logout', { method: 'POST' })
      this.user = null
      this.sessions = []
      this.initialized = true
    },
    async me() {
      try {
        const response = await apiRequest<{ user: AuthUser }>('/auth/me')
        this.user = response.user
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          this.user = null
        } else {
          this.setError(error)
        }
      } finally {
        this.initialized = true
      }

      return this.user
    },
    async verifyEmail(token: string) {
      return apiRequest('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
    },
    async forgotPassword(email: string) {
      return apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
    },
    async resetPassword(payload: ResetPasswordPayload) {
      return apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    async changePassword(payload: ChangePasswordPayload) {
      return apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    async loadSessions() {
      const response = await apiRequest<{ sessions: AuthSession[] }>('/auth/sessions')
      this.sessions = response.sessions
      return response.sessions
    },
    async revokeSession(id: string) {
      await apiRequest(`/auth/sessions/${id}`, { method: 'DELETE' })
      this.sessions = this.sessions.filter((session) => session.id !== id)
    },
  },
})
