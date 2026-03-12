import type { ApplicationStatus } from '../../types'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'

interface DrawerProgressProps {
  viewingStage?: ApplicationStatus | null
  onStageClick?: (status: ApplicationStatus) => void
  onStatusChange?: (newStatus: ApplicationStatus) => void
}

export default function DrawerProgress({ viewingStage, onStageClick, onStatusChange }: DrawerProgressProps) {
  const { selectedJob } = useTrackerStore()

  if (!selectedJob)
    return null

  const { status: currentStatus, stage_details: stageDetails } = selectedJob
  const currentIndex = APPLICATION_STATUS_ORDER.indexOf(currentStatus)
  const isRejected = currentStatus === 'rejected'
  const hasRejection = isRejected || stageDetails.some(s => s.status === '已拒绝')
  const progressText = isRejected
    ? '终止流程'
    : `${Math.max(currentIndex + 1, 1)} / ${APPLICATION_STATUS_ORDER.length}`

  const canGoBack = !isRejected && currentIndex > 0
  const canGoForward = !isRejected && currentIndex < APPLICATION_STATUS_ORDER.length - 1

  const handleBack = () => {
    if (canGoBack && onStatusChange) {
      onStatusChange(APPLICATION_STATUS_ORDER[currentIndex - 1])
    }
  }

  const handleForward = () => {
    if (canGoForward && onStatusChange) {
      onStatusChange(APPLICATION_STATUS_ORDER[currentIndex + 1])
    }
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium">申请进度</span>
        <div className="flex items-center gap-2">
          {/* 回退按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canGoBack}
            onClick={handleBack}
            title="退回上一阶段"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className={cn(
            'text-xs font-medium px-2',
            isRejected ? 'text-destructive' : 'text-muted-foreground',
          )}
          >
            {progressText}
          </span>
          {/* 前进按钮 */}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            disabled={!canGoForward}
            onClick={handleForward}
            title="推进到下一阶段"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center w-full">
        {APPLICATION_STATUS_ORDER.map((status, index) => {
          const isActive = isRejected || index <= currentIndex
          const isCurrent = index === currentIndex && !isRejected
          const isClickable = !isRejected && index <= currentIndex
          const isViewing = viewingStage === status

          return (
            <div key={status} className="flex items-center flex-1 last:flex-none">
              {/* Step */}
              <button
                type="button"
                onClick={() => isClickable && onStageClick?.(status)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1.5 relative',
                  isClickable ? 'cursor-pointer group' : 'cursor-default',
                )}
              >
                {/* 圆形节点 */}
                <div className={cn(
                  'size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all border-2',
                  isActive
                    ? hasRejection
                      ? 'bg-destructive/10 border-destructive text-destructive'
                      : isCurrent
                        ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/25'
                        : 'bg-primary/10 border-primary text-primary'
                    : 'bg-muted border-muted-foreground/20 text-muted-foreground',
                  isViewing && !hasRejection && 'ring-2 ring-primary ring-offset-2',
                  isClickable && 'group-hover:scale-110',
                )}
                >
                  {index + 1}
                </div>
                {/* 标签 */}
                <span className={cn(
                  'text-[10px] font-medium whitespace-nowrap',
                  isActive
                    ? hasRejection ? 'text-destructive' : 'text-foreground'
                    : 'text-muted-foreground',
                )}
                >
                  {APPLICATION_STATUS_CONFIG[status].label}
                </span>
              </button>

              {/* 连接线 */}
              {index < APPLICATION_STATUS_ORDER.length - 1 && (
                <div className="flex-1 px-1 -mt-5">
                  <div className={cn(
                    'h-0.5 w-full rounded-full transition-colors',
                    hasRejection
                      ? 'bg-destructive/30'
                      : index < currentIndex
                        ? 'bg-primary'
                        : 'bg-muted-foreground/20',
                  )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <Separator className="mt-4" />
    </div>
  )
}
