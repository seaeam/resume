import { CloudUpload, Plane, Wifi } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import useResumeListStore from '@/pages/resume/store'

function HeadBars() {
  const isOnline = useResumeListStore(s => s.isOnline)
  const offlineResumes = useResumeListStore(s => s.offlineResumes)
  const setShowSyncDialog = useResumeListStore(s => s.setShowSyncDialog)
  const hasOfflineResumesToSync = isOnline && offlineResumes.length > 0
  const isMobile = useIsMobile()

  return (
    <div className={isMobile ? 'flex flex-col gap-4' : 'flex items-start justify-between'}>
      <div>
        <h1 className={isMobile ? 'text-2xl font-bold tracking-tight' : 'text-3xl font-bold tracking-tight'}>
          我的简历
        </h1>
        <p className="text-muted-foreground mt-2">管理和编辑你的简历</p>
      </div>
      <div className={cn('mb-5', isMobile ? 'flex flex-col gap-3 items-end' : 'flex items-center gap-3')}>
        <div className={cn(
          'flex gap-2 items-center text-sm font-medium transition-colors duration-300',
          isOnline ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
        )}
        >
          {isOnline
            ? <Wifi className="h-3.5 w-3.5 animate-pulse" />
            : <Plane className="h-3.5 w-3.5 animate-bounce" />}
          <span className="relative">
            {isOnline ? '在线' : '离线'}
          </span>
        </div>
        <Button
          onClick={() => setShowSyncDialog(true)}
          variant="outline"
          size="sm"
          className={isMobile ? 'w-full' : ''}
          disabled={!hasOfflineResumesToSync}
        >
          <CloudUpload className="h-4 w-4 mr-2" />
          同步本地简历 (
          {offlineResumes.length}
          )
        </Button>
      </div>
    </div>
  )
}

export default HeadBars
