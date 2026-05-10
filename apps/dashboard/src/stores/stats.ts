import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { Stats } from './stats.model'

interface StatsState {
  stats: Stats | null
  loading: boolean
}

export const useStatsStore = defineStore('stats', {
  state: (): StatsState => ({
    stats: null,
    loading: false,
  }),
  actions: {
    async fetch(projectId?: string, from?: string, to?: string, groupBy?: string) {
      this.loading = true
      try {
        const params = new URLSearchParams()
        if (projectId) params.set('project', projectId)
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (groupBy) params.set('groupBy', groupBy)
        const query = params.toString()
        const response = await apiRequest<Stats>(`/stats${query ? `?${query}` : ''}`)
        this.stats = response
        return response
      } finally {
        this.loading = false
      }
    },
  },
})
