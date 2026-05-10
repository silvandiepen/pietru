import { defineStore } from 'pinia'
import { apiRequest } from '@/api/client'

export interface ReservedAddress {
  id: string
  local_part: string
  description: string | null
  admin_project_id: string
  is_active: number
  created_at: string
  updated_at: string
}

interface State {
  items: ReservedAddress[]
  loading: boolean
  error: string | null
}

export const useReservedAddressesStore = defineStore('reservedAddresses', {
  state: (): State => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        this.items = await apiRequest<ReservedAddress[]>('/admin/reserved-addresses')
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Failed to load'
      } finally {
        this.loading = false
      }
    },
    async create(localPart: string, description: string, adminProjectId: string) {
      const item = await apiRequest<ReservedAddress>('/admin/reserved-addresses', {
        method: 'POST',
        body: JSON.stringify({ localPart, description, adminProjectId }),
      })
      this.items.unshift(item)
      return item
    },
    async toggle(id: string, isActive: boolean) {
      await apiRequest(`/admin/reserved-addresses/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      })
      const item = this.items.find((i) => i.id === id)
      if (item) item.is_active = isActive ? 1 : 0
    },
    async remove(id: string) {
      await apiRequest(`/admin/reserved-addresses/${id}`, { method: 'DELETE' })
      this.items = this.items.filter((i) => i.id !== id)
    },
  },
})
