import { defineStore } from 'pinia'

import { ApiError, apiRequest } from '@/api/client'

import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  AuthUserResponse,
  ChangePasswordPayload,
  ResetPasswordPayload,
} from './auth.model'

/** Normalize a user object from either camelCase (login/register) or snake_case (/me) to a consistent shape */
function normalizeUser(raw: AuthUserResponse | AuthUser): AuthUser {
  const r = raw as unknown as Record<string, unknown>
  return {
    id: r.id as string,
    email: r.email as string,
    is_admin: (r.is_admin ?? r.isAdmin ?? false) as boolean,
    email_verified_at: (r.email_verified_at ?? r.emailVerifiedAt ?? null) as string | null,
    created_at: (r.created_at ?? r.createdAt ?? undefined) as string | undefined,
    updated_at: (r.updated_at ?? r.updatedAt ?? undefined) as string | undefined,
  }
}

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
    isAdmin: (state) => state.user?.is_admin === true,
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
        const response = await apiRequest<{ user: AuthUserResponse }>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.user = normalizeUser(response.user)
        this.initialized = true
        return this.user
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
        const response = await apiRequest<{ user: AuthUserResponse }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.user = normalizeUser(response.user)
        this.initialized = true
        return this.user
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
        this.user = normalizeUser(await apiRequest<AuthUser>('/auth/me'))
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
      this.sessions = await apiRequest<AuthSession[]>('/auth/sessions')
      return this.sessions
    },
    async revokeSession(id: string) {
      await apiRequest(`/auth/sessions/${id}`, { method: 'DELETE' })
      this.sessions = this.sessions.filter((session) => session.id !== id)
    },
  },
})
