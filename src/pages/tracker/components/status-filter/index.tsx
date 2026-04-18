import type { ApplicationStatus } from '../../types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { ALL_FILTER_STATUSES } from './const'

export default function StatusFilter() {
  const { jobs, filterStatus, setFilterStatus } = useTrackerStore()

  const getCount = (status: ApplicationStatus | null) => {
    if (status === null)
      return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  return (
    <div className="-mx-1 flex flex-nowrap gap-1 overflow-x-auto px-1 pb-1">
      {ALL_FILTER_STATUSES.map((status) => {
        const value = status ?? 'all'
        const isActive = filterStatus === status || (status === null && filterStatus === null)
        const label = status === null ? '全部' : APPLICATION_STATUS_CONFIG[status].label
        const count = getCount(status)

        return (
          <Button
            key={value}
            type="button"
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 shrink-0 gap-1.5 rounded-full px-3 text-sm',
              !isActive && 'border-border/70 bg-card/60',
            )}
            onClick={() => setFilterStatus(status)}
          >
            <span>{label}</span>
            <span className={cn(
              'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
              isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground',
            )}
            >
              {count}
            </span>
          </Button>
        )
      })}
    </div>
  )
}
