import type { ORDERType, ResumeSchema, ResumeType, VisibilityFormType } from '@/lib/schema'

export interface ResumeOption {
  id: string
  resume_id: string
  display_name: string
  type: string
}

export type ResumePreviewData = Partial<ResumeSchema> & {
  type?: ResumeType
  order?: ORDERType[]
  visibility?: Partial<VisibilityFormType> | Record<string, boolean>
}
