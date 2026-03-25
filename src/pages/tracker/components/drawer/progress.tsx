import type { ApplicationStatus } from '../../types'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'
import { getTrackerNextAction, getTrackerProgressHint } from '../../utils'

interface DrawerProgressProps {
  viewingStage?: ApplicationStatus | null
  onStageClick?: (status: ApplicationStatus) => void
  onStatusChange?: (newStatus: ApplicationStatus) => void
  onFocusCurrentStage?: () => void
}

export default function DrawerProgress({
  viewingStage,
  onStageClick,
  onStatusChange,
  onFocusCurrentStage,
}: DrawerProgressProps) {
  const { selectedJob } = useTrackerStore()

  if (!selectedJob)
    return null

  const { status: currentStatus, stage_details: stageDetails } = selectedJob
  const currentIndex = APPLICATION_STATUS_ORDER.indexOf(currentStatus)
  const isRejected = currentStatus === 'rejected'
  const hasRejection = isRejected || stageDetails.some(s => s.status === '已拒绝')
  const canGoBack = !isRejected && currentIndex > 0
  const canGoForward = !isRejected && currentIndex < APPLICATION_STATUS_ORDER.length - 1
  const nextAction = getTrackerNextAction(selectedJob)
  const progressHint = getTrackerProgressHint(selectedJob)
  const viewingLabel = viewingStage ? APPLICATION_STATUS_CONFIG[viewingStage].label : null
  const currentLabel = APPLICATION_STATUS_CONFIG[currentStatus].label

  const handleBack = () => {
    if (canGoBack && onStatusChange) {
      onStatusChange(APPLICATION_STATUS_ORDER[currentIndex - 1])
    }
  }

  const handleForward = () => {
    if (nextAction.targetStatus && onStatusChange) {
      onStatusChange(nextAction.targetStatus)
      return
    }

    if (onFocusCurrentStage) {
      onFocusCurrentStage()
    }
  }

  return (
    <div className="py-4">
      <div className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">流程推进</span>
              <Badge
                className={cn(
                  'rounded-full border-0 px-2.5 py-1 text-xs font-medium',
                  isRejected
                    ? 'bg-destructive/10 text-destructive'
                    : APPLICATION_STATUS_CONFIG[currentStatus].bgColor,
                  !isRejected && APPLICATION_STATUS_CONFIG[currentStatus].color,
                )}
              >
                当前阶段：
                {currentLabel}
              </Badge>
              {viewingLabel && viewingStage !== currentStatus && (
                <Badge variant="outline" className="rounded-full px-2.5 py-1 text-xs">
                  正在查看：
                  {viewingLabel}
                </Badge>
              )}
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{progressHint}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!canGoBack}
              onClick={handleBack}
            >
              <ArrowLeft className="size-4" />
              回到上一阶段
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              disabled={!nextAction.targetStatus && !onFocusCurrentStage}
              onClick={handleForward}
            >
              <ArrowRight className="size-4" />
              {nextAction.label}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {APPLICATION_STATUS_ORDER.map((status, index) => {
            const isActive = isRejected || index <= currentIndex
            const isCurrent = index === currentIndex && !isRejected
            const isClickable = !isRejected && index <= currentIndex
            const isViewing = viewingStage === status

            return (
              <button
                key={status}
                type="button"
                onClick={() => isClickable && onStageClick?.(status)}
                disabled={!isClickable}
                className={cn(
                  'flex min-h-[128px] flex-col items-start gap-2 rounded-2xl border px-3 py-3 text-left transition-all',
                  isActive
                    ? hasRejection
                      ? 'border-destructive/40 bg-destructive/5'
                      : 'border-primary/30 bg-primary/5'
                    : 'border-border/60 bg-background',
                  isViewing && 'ring-2 ring-primary/30',
                  isClickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-sm' : 'cursor-default',
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className={cn(
                    'flex size-8 items-center justify-center rounded-full text-xs font-semibold',
                    isActive
                      ? hasRejection
                        ? 'bg-destructive/10 text-destructive'
                        : isCurrent
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground',
                  )}
                  >
                    {index + 1}
                  </div>
                  {isCurrent && !hasRejection && (
                    <ChevronRight className="size-4 text-primary" />
                  )}
                </div>

                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                  >
                    {APPLICATION_STATUS_CONFIG[status].label}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {index < currentIndex ? '已完成，可查看记录' : index === currentIndex ? '当前处理中' : '尚未开始'}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Separator className="mt-4" />
    </div>
  )
}
