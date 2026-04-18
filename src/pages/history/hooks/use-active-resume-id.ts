import { useSearchParams } from 'react-router-dom'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import useCurrentResumeStore from '@/store/resume/current'
import { useHistoryResumeOptions } from './use-history-options'

export function useActiveHistoryResumeId() {
  const [searchParams] = useSearchParams()
  const currentResumeId = useCurrentResumeStore(state => state.resumeId)
  const { resumeOptions, loading } = useHistoryResumeOptions()

  const queryResumeId = searchParams.get('resumeId')
  const defaultResumeId = currentResumeId && !isOfflineResumeId(currentResumeId) ? currentResumeId : null

  const validResumeIds = new Set(resumeOptions.map(option => option.resumeId))
  const activeResumeId = queryResumeId && (loading || validResumeIds.has(queryResumeId))
    ? queryResumeId
    : !queryResumeId && defaultResumeId && (loading || validResumeIds.has(defaultResumeId))
        ? defaultResumeId
        : null

  return { activeResumeId, resumeOptions, loading }
}
