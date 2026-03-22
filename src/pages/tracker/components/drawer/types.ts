import type { ORDERType, ResumeSchema, ResumeType } from '@/lib/schema'

export interface ResumeOption {
  id: string
  resume_id: string
  display_name: string
  type: string
}

export type ResumePreviewData = Partial<ResumeSchema> & {
  type?: ResumeType
  order?: ORDERType[]
  visibility?: Record<string, boolean>
}
