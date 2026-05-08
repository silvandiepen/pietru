export interface Project {
  id: string
  name: string
  slug: string
  environment?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateProjectPayload {
  name: string
  slug: string
}
