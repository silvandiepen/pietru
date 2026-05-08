import type { Project } from '@/stores/projects.model'

export interface AppLayoutProps {
  projectName?: string
  environment?: string
  projects: Project[]
  activeProjectId: string | null
}
