import { History as HistoryIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import useCurrentResumeStore from '@/store/resume/current'
import HistoryHeader from './components/header'
import HistoryWorkspace from './components/workspace'
import { useHistoryResumeOptions } from './use-history-options'

function History() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentResumeId = useCurrentResumeStore(state => state.resumeId)

  const queryResumeId = searchParams.get('resumeId')
  const defaultResumeId = currentResumeId && !isOfflineResumeId(currentResumeId) ? currentResumeId : null

  const {
    resumeOptions,
    loading: resumeOptionsLoading,
    error: resumeOptionsError,
    reload: reloadResumeOptions,
  } = useHistoryResumeOptions()

  const validResumeIds = new Set(resumeOptions.map(option => option.resumeId))
  const activeResumeId = queryResumeId && (resumeOptionsLoading || validResumeIds.has(queryResumeId))
    ? queryResumeId
    : !queryResumeId && defaultResumeId && (resumeOptionsLoading || validResumeIds.has(defaultResumeId))
        ? defaultResumeId
        : null

  const handleResumeChange = (resumeId: string) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('resumeId', resumeId)
      return next
    })
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <HistoryHeader
        activeResumeId={activeResumeId}
        resumeOptions={resumeOptions}
        resumeOptionsLoading={resumeOptionsLoading}
        resumeOptionsError={resumeOptionsError}
        onResumeChange={handleResumeChange}
      />

      {!activeResumeId
        ? (
            <Empty className="min-h-[420px] border border-dashed bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>{resumeOptions.length > 0 ? '先选择一份简历' : '还没有可查看的云端简历'}</EmptyTitle>
                <EmptyDescription>
                  {resumeOptions.length > 0
                    ? '从上方下拉框选择简历后，这里会显示它的当前内容、版本时间线和恢复记录。'
                    : '历史版本当前只支持云端简历。先创建或同步一份云端简历后，再回到这里查看版本时间线。'}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        : (
            <HistoryWorkspace
              activeResumeId={activeResumeId}
              onReloadResumeOptions={reloadResumeOptions}
            />
          )}
    </div>
  )
}

export default History
