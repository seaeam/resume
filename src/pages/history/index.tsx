import { History as HistoryIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import HistoryHeader from './components/header'
import HistoryWorkspace from './components/workspace'
import { useActiveHistoryResumeId } from './hooks/use-active-resume-id'
import { useHistoryResumeOptions } from './hooks/use-history-options'

function History() {
  const { activeResumeId, resumeOptions } = useActiveHistoryResumeId()
  const { reload: reloadResumeOptions } = useHistoryResumeOptions()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <HistoryHeader />

      {!activeResumeId
        ? (
            <Empty className="min-h-[420px] border border-dashed bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HistoryIcon />
                </EmptyMedia>
                <EmptyTitle>{resumeOptions.length > 0 ? '请选择一份简历' : '暂无云端简历'}</EmptyTitle>
                <EmptyDescription>
                  {resumeOptions.length > 0
                    ? '选择简历后，这里会显示当前内容、历史版本以及恢复记录。'
                    : '当前仅支持查看云端简历的版本记录。请先创建云端简历，或将本地简历同步到云端后再查看。'}
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
