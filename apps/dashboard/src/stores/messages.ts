import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type {
  InboxMessage,
  Message,
  MessageDetail,
  MessageFilters,
} from './messages.model'

interface MessagesState {
  items: Message[]
  detail: MessageDetail | null
  nextCursor: string | null
  loading: boolean
}

function toQuery(filters: MessageFilters) {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }

  return params.toString()
}

export const useMessagesStore = defineStore('messages', {
  state: (): MessagesState => ({
    items: [],
    detail: null,
    nextCursor: null,
    loading: false,
  }),
  actions: {
    async list(projectId: string, filters: MessageFilters = {}) {
      this.loading = true
      try {
        const query = toQuery({
          project: projectId,
          ...filters,
        } as MessageFilters & { project: string })
        const response = await apiRequest<{ messages: Message[]; nextCursor?: string | null }>(`/messages?${query}`)
        this.items = response.messages
        this.nextCursor = response.nextCursor ?? null
        return response.messages
      } finally {
        this.loading = false
      }
    },
    async get(messageId: string) {
      const response = await apiRequest<{ message: MessageDetail }>(`/messages/${messageId}`)
      this.detail = response.message
      return response.message
    },
    async listTestInboxMessages(inbox: string) {
      const response = await apiRequest<{ messages: InboxMessage[] }>(`/test-inboxes/${inbox}/messages`)
      return response.messages
    },
  },
})
