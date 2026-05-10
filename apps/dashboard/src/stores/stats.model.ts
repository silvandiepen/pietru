export interface StatsTotals {
  sent: number
  failed: number
  captured: number
  received: number
}

export interface TimelineEntry {
  date: string
  sent: number
  failed: number
  captured: number
  received: number
}

export interface StatsByProject {
  projectId: string
  projectName: string
  sent: number
  failed: number
  captured: number
  received: number
}

export interface Stats {
  period: { from: string; to: string; groupBy: string }
  totals: StatsTotals
  byProject: StatsByProject[]
  timeline: TimelineEntry[]
}
