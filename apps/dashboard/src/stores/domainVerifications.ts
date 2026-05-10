import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface DomainVerification {
  id: string
  project_id: string
  domain: string
  verification_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'DELETED' | 'NOT_STARTED' | string
  dkim_status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NOT_STARTED' | string
  verification_tokens_json: string | null
  dkim_tokens_json: string | null
  dkim_tokens: string[] | null
  error_message: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

const API_BASE = '/v1'

export const useDomainVerificationsStore = defineStore('domainVerifications', () => {
  const items = ref<DomainVerification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  function clearError() {
    error.value = null
  }

  async function fetchAll(projectId: string) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/domain-verifications`, {
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      items.value = data.data || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to fetch domain verifications'
    } finally {
      loading.value = false
    }
  }

  async function addDomain(projectId: string, domain: string) {
    clearError()
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/domain-verifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      items.value.unshift(data.data)
      return data.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to add domain'
      throw e
    }
  }

  async function verifyDomain(projectId: string, domainId: string) {
    clearError()
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/domain-verifications/${domainId}/verify`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message || `HTTP ${res.status}`)
      }
      const data = await res.json()
      const idx = items.value.findIndex((i) => i.id === domainId)
      if (idx >= 0) items.value[idx] = data.data
      return data.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to verify domain'
      throw e
    }
  }

  async function removeDomain(projectId: string, domainId: string) {
    clearError()
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/domain-verifications/${domainId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error?.message || `HTTP ${res.status}`)
      }
      const idx = items.value.findIndex((i) => i.id === domainId)
      if (idx >= 0) {
        items.value[idx].verification_status = 'DELETED'
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to remove domain'
      throw e
    }
  }

  return { items, loading, error, clearError, fetchAll, addDomain, verifyDomain, removeDomain }
})
