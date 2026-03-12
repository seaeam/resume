import { Loader2, Send } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import useTrackerStore from '@/pages/tracker/store'

const STALE_DAYS = 7

export function FollowUpModule() {
  const navigate = useNavigate()
  const { jobs, loading, init, isInitialized } = useTrackerStore()

  useEffect(() => {
    if (!isInitialized) {
      init()
    }
  }, [init, isInitialized])

  // 计算超过 N 天未跟进的岗位数
  const now = new Date()
  const pendingCount = jobs.filter((job) => {
    if (job.status === 'offer' || job.status === 'rejected')
      return false
    const lastUpdate = new Date(job.updated_at)
    const daysDiff = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff >= STALE_DAYS
  }).length

  return (
    <div className="flex flex-col h-full relative">
      <div className="hidden md:block absolute -left-2 top-1 bottom-0 w-px bg-border/50" />
      <div className="flex items-center gap-2 mb-2.5">
        <Send className="size-3.5 text-emerald-500" />
        <h4 className="font-medium text-xs">投递跟进</h4>
      </div>
      <div className="bg-emerald-50/80 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100/80 dark:border-emerald-900/20 flex-1 flex flex-col">
        <div className="flex-1">
          {loading
            ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-3 animate-spin text-emerald-500" />
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90">加载中...</p>
                </div>
              )
            : pendingCount > 0
              ? (
                  <div className="flex items-start gap-2">
                    <span className="relative flex h-1.5 w-1.5 mt-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                    </span>
                    <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                      有
                      {' '}
                      <span className="font-semibold text-sm">{pendingCount}</span>
                      {' '}
                      个岗位超过
                      <span className="font-semibold">
                        {' '}
                        {STALE_DAYS}
                      </span>
                      {' '}
                      天没跟进
                    </p>
                  </div>
                )
              : (
                  <p className="text-xs text-emerald-700/90 dark:text-emerald-400/90 leading-relaxed">
                    {jobs.length > 0 ? '所有岗位跟进状态良好 ✓' : '暂无投递记录'}
                  </p>
                )}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 w-full mt-2.5 text-xs border-emerald-200/80 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800/50 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
          onClick={() => navigate('/tracker')}
        >
          投递看板
        </Button>
      </div>
    </div>
  )
}
