import type { ApplicationStatus, StageDetail } from '../../types'
import { cn } from '@/lib/utils'

const STATUS_STEPS: ApplicationStatus[] = ['saved', 'applied', 'screen', 'interview', 'offer']
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  saved: '已保存',
  applied: '已投递',
  screen: '筛选中',
  interview: '面试中',
  offer: '已录用',
  rejected: '已拒绝',
}
interface DrawerProgressProps {
  currentStatus: ApplicationStatus
  stageDetails: StageDetail[]
  viewingStage?: ApplicationStatus | null
  onStageClick?: (status: ApplicationStatus) => void
}
export function DrawerProgress({ currentStatus, stageDetails, viewingStage, onStageClick }: DrawerProgressProps) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus)
  const isRejected = currentStatus === 'rejected'
  const hasRejection = isRejected || stageDetails.some(s => s.status === '已拒绝')

  // rejected 时进度条宽度 100%，否则正常计算
  const progressWidth = isRejected
    ? 100
    : ((currentIndex + 1) / STATUS_STEPS.length) * 100

  return (
    <div className="py-4 border-b">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">申请进度</span>
        <span className={cn('text-xs', isRejected ? 'text-destructive font-medium' : 'text-muted-foreground')}>
          {isRejected ? '终止流程' : `${currentIndex + 1} / ${STATUS_STEPS.length}`}
        </span>
      </div>
      {/* 进度条 */}
      <div className="max-w-sm mx-auto">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
          <div
            className={cn(
              'h-full transition-all rounded-full',
              hasRejection ? 'bg-destructive' : 'bg-primary',
            )}
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        {/* 节点 */}
        <div className="flex justify-between">
          {STATUS_STEPS.map((status, index) => {
            const isActive = isRejected || index <= currentIndex
            // 已完成的阶段和当前阶段都可以点击
            const isClickable = !isRejected && index <= currentIndex
            // 是否正在查看此阶段
            const isViewing = viewingStage === status

            return (
              <button
                key={status}
                type="button"
                onClick={() => isClickable && onStageClick?.(status)}
                disabled={!isClickable}
                className={cn(
                  'flex flex-col items-center gap-1',
                  isClickable ? 'cursor-pointer' : 'cursor-default',
                )}
              >
                <div className={cn(
                  'size-6 rounded-full flex items-center justify-center text-[10px] font-medium transition-all',
                  isActive
                    ? hasRejection
                      ? 'bg-destructive text-destructive-foreground'
                      : 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                  // 当前实际阶段或正在查看的阶段高亮
                  (isViewing || (index === currentIndex && !viewingStage)) && !hasRejection && 'ring-2 ring-primary ring-offset-1',
                )}
                >
                  {index + 1}
                </div>
                <span className={cn(
                  'text-[10px]',
                  isActive
                    ? hasRejection ? 'text-destructive' : 'text-foreground'
                    : 'text-muted-foreground',
                )}
                >
                  {STATUS_LABELS[status]}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
