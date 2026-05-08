import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { ProviderConfig, ProviderConfigPayload } from './providers.model'

interface ProvidersState {
  items: Record<string, ProviderConfig[]>
}

export const useProvidersStore = defineStore('providers', {
  state: (): ProvidersState => ({
    items: {},
  }),
  actions: {
    async list(projectId: string) {
      const response = await apiRequest<ProviderConfig[]>(`/projects/${projectId}/provider-configs`)
      this.items[projectId] = response
      return response
    },
    async create(projectId: string, payload: ProviderConfigPayload) {
      const response = await apiRequest<ProviderConfig>(`/projects/${projectId}/provider-configs`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await this.list(projectId)
      return response
    },
    async update(projectId: string, configId: string, payload: Partial<ProviderConfigPayload>) {
      const response = await apiRequest<ProviderConfig>(
        `/projects/${projectId}/provider-configs/${configId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        },
      )
      await this.list(projectId)
      return response
    },
    async validate(projectId: string, configId: string) {
      return apiRequest<{ valid: boolean; message?: string }>(`/projects/${projectId}/provider-configs/${configId}/validate`, {
        method: 'POST',
      })
    },
  },
})
