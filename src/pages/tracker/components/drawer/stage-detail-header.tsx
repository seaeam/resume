import type { StageStatus } from '../../types'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, STAGE_STATUS_COLORS, STAGE_STATUS_OPTIONS } from '../../const'

interface StageDetailHeaderProps {
  displayStage: string
  currentStatus: StageStatus
  statusColors: Record<string, string>
  isViewingHistory?: boolean
  isStatusOpen: boolean
  onStatusOpenChange: (open: boolean) => void
  onStatusChange: (status: StageStatus) => void
}

export function StageDetailHeader({
  displayStage,
  currentStatus,
  statusColors,
  isViewingHistory = false,
  isStatusOpen,
  onStatusOpenChange,
  onStatusChange,
}: StageDetailHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="font-semibold">
        {(APPLICATION_STATUS_CONFIG as Record<string, any>)[displayStage].label}
      </h3>
      {!isViewingHistory
        ? (
            <Popover open={isStatusOpen} onOpenChange={onStatusOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all',
                    'border cursor-pointer hover:opacity-80',
                    statusColors.bg,
                    statusColors.text,
                    statusColors.border,
                  )}
                >
                  {currentStatus}
                  <ChevronDown className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="end">
                <div className="flex flex-col">
                  {STAGE_STATUS_OPTIONS.map((status) => {
                    const colors = STAGE_STATUS_COLORS[status]
                    const isSelected = status === currentStatus
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusChange(status)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                          'hover:bg-muted cursor-pointer',
                          isSelected && 'bg-muted',
                        )}
                      >
                        <span className={cn('inline-flex items-center gap-2', colors.text)}>
                          <span className={cn('size-2 rounded-full', colors.bg, 'border', colors.border)} />
                          {status}
                        </span>
                        {isSelected && <span className="text-primary">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )
        : (
            <Badge className={cn(statusColors.bg, statusColors.text, statusColors.border, 'border')}>
              {currentStatus}
            </Badge>
          )}
    </div>
  )
}
