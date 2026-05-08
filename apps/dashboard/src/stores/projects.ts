import { defineStore } from 'pinia'

import { apiRequest } from '@/api/client'

import type { CreateProjectPayload, Project } from './projects.model'

interface ProjectsState {
  items: Project[]
  activeProjectId: string | null
  loading: boolean
}

export const useProjectsStore = defineStore('projects', {
  state: (): ProjectsState => ({
    items: [],
    activeProjectId: null,
    loading: false,
  }),
  getters: {
    activeProject: (state) => state.items.find((project) => project.id === state.activeProjectId) ?? null,
  },
  actions: {
    async list() {
      this.loading = true
      try {
        const response = await apiRequest<Project[]>('/projects')
        this.items = response
        if (!this.activeProjectId && response[0]) {
          this.activeProjectId = response[0].id
        }
        return response
      } finally {
        this.loading = false
      }
    },
    async create(payload: CreateProjectPayload) {
      const response = await apiRequest<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.items.unshift(response)
      this.activeProjectId = response.id
      return response
    },
    async get(id: string) {
      const response = await apiRequest<Project>(`/projects/${id}`)
      const existing = this.items.findIndex((item) => item.id === id)
      if (existing >= 0) {
        this.items.splice(existing, 1, response)
      } else {
        this.items.push(response)
      }
      return response
    },
    async update(id: string, payload: Partial<CreateProjectPayload>) {
      const response = await apiRequest<Project>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) {
        this.items.splice(index, 1, response)
      }
      return response
    },
    async delete(id: string) {
      await apiRequest(`/projects/${id}`, { method: 'DELETE' })
      this.items = this.items.filter((item) => item.id !== id)
      if (this.activeProjectId === id) {
        this.activeProjectId = this.items[0]?.id ?? null
      }
    },
    setActiveProject(id: string) {
      this.activeProjectId = id
    },
  },
})
