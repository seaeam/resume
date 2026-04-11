import { z } from 'zod'

export * from './config'
export {
  DEFAULT_ORDER,
  LEGACY_KEY_MAP,
  migrateOrder,
  migrateVisibility,
  resumeSchema,
} from './form'
export type {
  ORDERType,
  ResumeSchema,
  VisibilityItemsType,
} from './form'

// 模板类型
export const resumeTypeEnum = z.enum(['default', 'simple', 'modern'])
export type ResumeType = z.infer<typeof resumeTypeEnum>

export function normalizeResumeType(value: unknown): ResumeType {
  if (value === 'default' || value === 'simple' || value === 'modern') {
    return value
  }

  if (value === 'basic') {
    return 'default'
  }

  return 'default'
}

// 简历列表
export interface ResumeListItem {
  resume_id: string
  created_at: string
  updated_at?: string
  type: ResumeType
  display_name?: string
  description?: string
  isOffline?: boolean
}

export * from './form'
export * from './persisted'
export type { ResumeTemplateBinding } from './persisted'
export * from './visibility'
