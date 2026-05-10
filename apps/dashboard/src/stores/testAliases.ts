import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { CreateTestAliasPayload, TestAlias, TestAliasesListResponse, UpdateTestAliasPayload } from './testAliases.model'

interface TestAliasesState {
  items: TestAlias[]
  count: number
  limit: number
  loading: boolean
  error: string | null
}

export const useTestAliasesStore = defineStore('testAliases', {
  state: (): TestAliasesState => ({
    items: [],
    count: 0,
    limit: 100,
    loading: false,
    error: null,
  }),

  getters: {
    canCreate: (state) => state.count < state.limit,
    remaining: (state) => state.limit - state.count,
  },

  actions: {
    async list() {
      this.loading = true
      this.error = null
      try {
        const response = await apiRequest<TestAliasesListResponse>('/test-aliases')
        this.items = response.aliases
        this.count = response.count
        this.limit = response.limit
        return response
      } catch (err: any) {
        this.error = err?.message || 'Failed to load test aliases'
        throw err
      } finally {
        this.loading = false
      }
    },

    async create(payload: CreateTestAliasPayload) {
      const response = await apiRequest<TestAlias>('/test-aliases', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.items.unshift(response)
      this.count++
      return response
    },

    async update(aliasId: string, payload: UpdateTestAliasPayload) {
      const response = await apiRequest<TestAlias>(`/test-aliases/${aliasId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const index = this.items.findIndex((a) => a.id === aliasId)
      if (index >= 0) {
        this.items.splice(index, 1, response)
      }
      return response
    },

    async remove(aliasId: string) {
      await apiRequest(`/test-aliases/${aliasId}`, { method: 'DELETE' })
      this.items = this.items.filter((a) => a.id !== aliasId)
      this.count--
    },

    async toggle(aliasId: string) {
      const alias = this.items.find((a) => a.id === aliasId)
      if (!alias) return
      await this.update(aliasId, { isActive: !alias.isActive })
    },
  },
})
