import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { ApiKey, ApiKeyCreatePayload, ApiKeyCreateResponse } from './apiKeys.model'

interface ApiKeysState {
  items: Record<string, ApiKey[]>
  lastCreatedKey: ApiKeyCreateResponse | null
}

export const useApiKeysStore = defineStore('apiKeys', {
  state: (): ApiKeysState => ({
    items: {},
    lastCreatedKey: null,
  }),
  actions: {
    async list(projectId: string) {
      const response = await apiRequest<{ apiKeys: ApiKey[] }>(`/projects/${projectId}/api-keys`)
      this.items[projectId] = response.apiKeys
      return response.apiKeys
    },
    async create(projectId: string, payload: ApiKeyCreatePayload) {
      const response = await apiRequest<{ apiKey: ApiKeyCreateResponse }>(`/projects/${projectId}/api-keys`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.lastCreatedKey = response.apiKey
      await this.list(projectId)
      return response.apiKey
    },
    async revoke(projectId: string, keyId: string) {
      await apiRequest(`/projects/${projectId}/api-keys/${keyId}`, {
        method: 'DELETE',
      })
      this.items[projectId] = (this.items[projectId] || []).filter((key) => key.id !== keyId)
    },
    clearLastCreatedKey() {
      this.lastCreatedKey = null
    },
  },
})
