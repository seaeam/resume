import type { ORDERType, ResumeSchema } from '@/lib/schema'

export interface ResumeOption {
  id: string
  resume_id: string
  display_name: string
  type: string
}

export type ResumePreviewData = Partial<ResumeSchema> & {
  type?: 'basic' | 'modern' | 'simple'
  order?: ORDERType[]
  visibility?: Record<string, boolean>
}
