import type { AtsEvaluationResult } from '../../../types'
import type { ResumeToolContext } from './types'
import { fetchResumeDataForAnalysis } from '../../../utils'

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
