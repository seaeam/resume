import type { ResumeSpotlight } from './use-resume-spotlights'
import { Download, History } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import useCurrentResumeStore from '@/store/resume/current'
import { formatRelativeTime } from '@/utils/date'
import { RotatingSlot } from './rotating-slot'

interface ExportModuleProps {
  items: ResumeSpotlight[]
  activeIndex: number
  loading: boolean
  onSelectIndex: (index: number) => void
}

export function ExportModule({
  items,
  activeIndex,
  loading,
  onSelectIndex: _onSelectIndex,
}: ExportModuleProps) {
  const navigate = useNavigate()
  const { setCurrentResume } = useCurrentResumeStore()
  const activeItem = items[activeIndex] ?? null

  const handleViewHistory = (item: ResumeSpotlight) => {
    setCurrentResume(item.resume.resume_id, item.resume.type)
    navigate(`/history?resumeId=${item.resume.resume_id}`)
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="absolute top-1 bottom-0 -left-2 hidden w-px bg-border/50 md:block" />
      <div className="mb-2.5 flex items-center gap-2">
        <Download className="size-3.5 text-blue-500" />
        <h4 className="text-xs font-medium">版本管理</h4>
      </div>
      <div className="flex h-full min-h-[100px] flex-col justify-between rounded-lg border border-blue-100/80 bg-blue-50/80 p-3 dark:border-blue-900/20 dark:bg-blue-950/20">
        <div className="min-h-18">
          <RotatingSlot
            activeKey={loading ? 'loading' : activeItem?.resume.resume_id ?? 'empty'}
            className="min-h-18"
            contentClassName="gap-1"
          >
            {loading
              ? (
                  <>
                    <p className="text-[10px] text-blue-700/75 dark:text-blue-400/80">正在切换简历状态...</p>
                    <p className="text-xs text-blue-700/90 dark:text-blue-400/90">正在加载版本信息</p>
                  </>
                )
              : activeItem
                ? (
                    <>
                      <p className="truncate text-[10px] font-medium text-blue-700/75 dark:text-blue-400/80">
                        {activeItem.resume.display_name || '未命名简历'}
                      </p>
                      {activeItem.version.count > 0
                        ? (
                            <>
                              <p className="text-xs leading-tight text-blue-700/90 dark:text-blue-400/90">
                                已保存
                                {' '}
                                <span className="font-semibold">{activeItem.version.count}</span>
                                {' '}
                                个版本
                              </p>
                              {activeItem.version.latestVersionAt && (
                                <p className="text-[10px] leading-tight text-muted-foreground">
                                  最近编辑：
                                  {' '}
                                  {formatRelativeTime(activeItem.version.latestVersionAt)}
                                </p>
                              )}
                            </>
                          )
                        : (
                            <p className="text-xs text-blue-700/90 dark:text-blue-400/90">
                              还没有历史版本
                            </p>
                          )}
                    </>
                  )
                : (
                    <>
                      <p className="text-xs text-blue-700/90 dark:text-blue-400/90">
                        还没有云端简历
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        同步至少一份云端简历后，这里会轮播展示每份简历的版本状态。
                      </p>
                    </>
                  )}
          </RotatingSlot>
        </div>

        {activeItem && (
          <div className="mt-2 h-7 w-full">
            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full border-blue-500 bg-blue-500 text-xs text-white hover:border-blue-600 hover:bg-blue-600"
              onClick={() => handleViewHistory(activeItem)}
            >
              <History className="mr-1.5 size-3" />
              查看历史版本
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
