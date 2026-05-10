import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { InboxMessage, InboxMessageDetail, InboxFilters } from './inbox.model'

interface InboxState {
  items: InboxMessage[]
  detail: InboxMessageDetail | null
  nextCursor: string | null
  loading: boolean
}

function toQuery(filters: InboxFilters) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  return params.toString()
}

export const useInboxStore = defineStore('inbox', {
  state: (): InboxState => ({
    items: [],
    detail: null,
    nextCursor: null,
    loading: false,
  }),
  actions: {
    async list(filters: InboxFilters = {}) {
      this.loading = true
      try {
        const query = toQuery(filters)
        const response = await apiRequest<{ items: InboxMessage[]; nextCursor?: string | null }>(
          `/inbox${query ? `?${query}` : ''}`,
        )
        this.items = response.items
        this.nextCursor = response.nextCursor ?? null
        return response.items
      } finally {
        this.loading = false
      }
    },
    async get(messageId: string) {
      const response = await apiRequest<InboxMessageDetail>(`/inbox/${messageId}`)
      this.detail = response
      return response
    },
  },
})
