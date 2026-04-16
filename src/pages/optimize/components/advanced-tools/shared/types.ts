import type { ResumeSchema } from '@/lib/schema'
import type { AtsEvaluationResult } from '@/pages/optimize/types'

export type AdvancedToolKey = 'job-description' | 'formatter' | 'ats-preview' | 'benchmark'

export interface ResumeToolContext {
  resumeId: string
  resumeType: 'online' | 'offline'
  resume: ResumeSchema
  atsConfig: AtsEvaluationResult | null
}

export interface ResumeToolSummary {
  title: string
  jobIntent: string
  sectionCount: number
}

export interface AdvancedToolDefinition {
  key: AdvancedToolKey
  title: string
  description: string
}

export type ToolTone = 'default' | 'danger' | 'info' | 'primary' | 'success' | 'warning'
