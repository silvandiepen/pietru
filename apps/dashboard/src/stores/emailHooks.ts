import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { EmailHook, CreateEmailHookPayload, UpdateEmailHookPayload } from './emailHooks.model'

interface EmailHooksState {
  items: Record<string, EmailHook[]>
}

export const useEmailHooksStore = defineStore('emailHooks', {
  state: (): EmailHooksState => ({
    items: {},
  }),
  actions: {
    async list(projectId: string) {
      const response = await apiRequest<EmailHook[]>(`/projects/${projectId}/email-hooks`)
      this.items[projectId] = response
      return response
    },
    async create(projectId: string, payload: CreateEmailHookPayload) {
      const response = await apiRequest<EmailHook>(`/projects/${projectId}/email-hooks`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await this.list(projectId)
      return response
    },
    async update(projectId: string, hookId: string, payload: UpdateEmailHookPayload) {
      const response = await apiRequest<EmailHook>(`/projects/${projectId}/email-hooks/${hookId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      await this.list(projectId)
      return response
    },
    async delete(projectId: string, hookId: string) {
      await apiRequest(`/projects/${projectId}/email-hooks/${hookId}`, {
        method: 'DELETE',
      })
      this.items[projectId] = (this.items[projectId] || []).filter((hook) => hook.id !== hookId)
    },
    async toggle(projectId: string, hookId: string) {
      const hook = (this.items[projectId] || []).find((h) => h.id === hookId)
      if (!hook) return
      await this.update(projectId, hookId, { is_active: !hook.is_active })
    },
  },
})
