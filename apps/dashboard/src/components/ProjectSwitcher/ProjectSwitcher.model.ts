import type { Project } from '@/stores/projects.model'

export interface ProjectSwitcherProps {
  modelValue: string | null
  projects: Project[]
}
