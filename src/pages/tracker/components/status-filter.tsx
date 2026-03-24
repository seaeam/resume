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
    if (status === null)
      return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  return (
    <div className="scrollbar-gutter-stable flex items-center gap-2 overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors shrink-0 whitespace-nowrap',
              isActive
                ? 'bg-foreground text-background shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {label}
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[11px]',
              isActive ? 'opacity-80' : 'opacity-60',
            )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
