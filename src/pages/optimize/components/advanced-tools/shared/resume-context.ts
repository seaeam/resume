import type { ResumeToolContext } from './types'
import type { AtsEvaluationResult } from '@/pages/optimize/types'
import { fetchResumeDataForAnalysis } from '@/pages/optimize/utils'

interface LoadResumeContextOptions {
  atsConfig: AtsEvaluationResult | null
  resumeId: string
  resumeType: 'online' | 'offline'
}

export async function loadResumeToolContext(options: LoadResumeContextOptions): Promise<ResumeToolContext> {
  const resume = await fetchResumeDataForAnalysis(options.resumeId, options.resumeType === 'offline')

  return {
    resumeId: options.resumeId,
    resumeType: options.resumeType,
    resume,
    atsConfig: options.atsConfig,
  }
}
