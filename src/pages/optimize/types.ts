export interface Issue {
  id: string
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  description: string
  impact: string
}

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
  mandatory: boolean
}

export interface ResumeItem {
  id: string
  name: string
  date: string
  score: number
}
