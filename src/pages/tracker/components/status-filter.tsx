import type { ApplicationStatus } from '../types'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../const'
import useTrackerStore from '../store'

const ALL_FILTER_STATUSES: (ApplicationStatus | null)[] = [
  null,
  ...APPLICATION_STATUS_ORDER,
  'rejected',
]

export function StatusFilter() {
  const { jobs, filterStatus, setFilterStatus } = useTrackerStore()

  const getCount = (status: ApplicationStatus | null) => {
    if (status === null) return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ALL_FILTER_STATUSES.map((status) => {
        const isActive = filterStatus === status
        const label = status === null ? '全部' : APPLICATION_STATUS_CONFIG[status].label
        const count = getCount(status)

        return (
          <button
            key={status ?? 'all'}
            type="button"
            onClick={() => setFilterStatus(status)}
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 whitespace-nowrap',
              isActive
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {label}
            <span className={cn(
              'text-xs',
              isActive ? 'opacity-80' : 'opacity-60',
            )}>
              ({count})
            </span>
          </button>
        )
      })}
    </div>
  )
}
