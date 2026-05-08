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
        const response = await apiRequest<{ projects: Project[] }>('/projects')
        this.items = response.projects
        if (!this.activeProjectId && response.projects[0]) {
          this.activeProjectId = response.projects[0].id
        }
        return response.projects
      } finally {
        this.loading = false
      }
    },
    async create(payload: CreateProjectPayload) {
      const response = await apiRequest<{ project: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.items.unshift(response.project)
      this.activeProjectId = response.project.id
      return response.project
    },
    async get(id: string) {
      const response = await apiRequest<{ project: Project }>(`/projects/${id}`)
      const existing = this.items.findIndex((item) => item.id === id)
      if (existing >= 0) {
        this.items.splice(existing, 1, response.project)
      } else {
        this.items.push(response.project)
      }
      return response.project
    },
    async update(id: string, payload: Partial<CreateProjectPayload>) {
      const response = await apiRequest<{ project: Project }>(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      const index = this.items.findIndex((item) => item.id === id)
      if (index >= 0) {
        this.items.splice(index, 1, response.project)
      }
      return response.project
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
