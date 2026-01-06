import type { ResumeType } from '@/store/resume/current'

export interface ResumeStats {
  total: number
  online: number
  offline: number
  recentCount: number
  latestResume: Resume
}

export interface Resume {
  resume_id: string
  created_at: string
  type: ResumeType
  display_name?: string
  description?: string
  isOffline?: boolean
}
