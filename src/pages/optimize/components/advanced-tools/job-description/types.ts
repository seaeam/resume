import type { ResumeSchema } from '@/lib/schema'

export interface JobSectionMatch {
  sectionKey: keyof ResumeSchema
  sectionLabel: string
  matchedCount: number
  coverage: number
  matchedKeywords: string[]
}

export interface JobDescriptionComparisonResult {
  matchScore: number
  extractedKeywords: string[]
  matchedKeywords: string[]
  missingKeywords: string[]
  recommendations: string[]
  sectionMatches: JobSectionMatch[]
}
