import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type {
  CreateMailingListPayload,
  MailingList,
  MailingListSubscriber,
  SubscribersResponse,
  UpdateMailingListPayload,
} from './mailingLists.model'

interface MailingListsState {
  lists: MailingList[]
  currentList: MailingList | null
  subscribers: MailingListSubscriber[]
  subscribersTotal: number
  loading: boolean
  error: string | null
}

export const useMailingListsStore = defineStore('mailingLists', {
  state: (): MailingListsState => ({
    lists: [],
    currentList: null,
    subscribers: [],
    subscribersTotal: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchLists() {
      this.loading = true
      this.error = null
      try {
        this.lists = await apiRequest<MailingList[]>('/mailing-lists')
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load mailing lists'
      } finally {
        this.loading = false
      }
    },

    async fetchList(listId: string) {
      this.loading = true
      this.error = null
      try {
        this.currentList = await apiRequest<MailingList>(`/mailing-lists/${listId}`)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load mailing list'
      } finally {
        this.loading = false
      }
    },

    async createList(payload: CreateMailingListPayload) {
      this.error = null
      try {
        const list = await apiRequest<MailingList>('/mailing-lists', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.lists.unshift(list)
        return list
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to create mailing list'
        throw err
      }
    },

    async updateList(listId: string, payload: UpdateMailingListPayload) {
      this.error = null
      try {
        const updated = await apiRequest<MailingList>(`/mailing-lists/${listId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        const idx = this.lists.findIndex((l) => l.id === listId)
        if (idx >= 0) this.lists[idx] = updated
        if (this.currentList?.id === listId) this.currentList = updated
        return updated
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to update mailing list'
        throw err
      }
    },

    async deleteList(listId: string) {
      this.error = null
      try {
        await apiRequest(`/mailing-lists/${listId}`, { method: 'DELETE' })
        this.lists = this.lists.filter((l) => l.id !== listId)
        if (this.currentList?.id === listId) this.currentList = null
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to delete mailing list'
        throw err
      }
    },

    async fetchSubscribers(listId: string, status?: string, limit = 50, offset = 0) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        params.set('limit', String(limit))
        params.set('offset', String(offset))
        if (status) params.set('status', status)
        const result = await apiRequest<SubscribersResponse>(
          `/mailing-lists/${listId}/subscribers?${params.toString()}`,
        )
        this.subscribers = result.subscribers
        this.subscribersTotal = result.total
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load subscribers'
      } finally {
        this.loading = false
      }
    },

    async removeSubscriber(listId: string, subscriberId: string) {
      this.error = null
      try {
        await apiRequest(`/mailing-lists/${listId}/subscribers/${subscriberId}`, {
          method: 'DELETE',
        })
        this.subscribers = this.subscribers.filter((s) => s.id !== subscriberId)
        this.subscribersTotal--
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to remove subscriber'
        throw err
      }
    },
  },
})
