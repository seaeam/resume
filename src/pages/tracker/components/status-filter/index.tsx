import type { ApplicationStatus } from '../../types'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'

const ALL_FILTER_STATUSES: (ApplicationStatus | null)[] = [
  null,
  ...APPLICATION_STATUS_ORDER,
  'rejected',
]

export default function StatusFilter() {
  const { jobs, filterStatus, setFilterStatus } = useTrackerStore()
  const activeValue = filterStatus ?? 'all'

  const getCount = (status: ApplicationStatus | null) => {
    if (status === null)
      return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  return (
    <ToggleGroup
      type="single"
      value={activeValue}
      variant="outline"
      spacing={2}
      className="scrollbar-gutter-stable w-full justify-start overflow-x-auto rounded-2xl border border-border/60 bg-card/60 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      onValueChange={(value) => {
        if (!value)
          return
        setFilterStatus(value === 'all' ? null : value as ApplicationStatus)
      }}
    >
      {ALL_FILTER_STATUSES.map((status) => {
        const value = status ?? 'all'
        const label = status === null ? '全部' : APPLICATION_STATUS_CONFIG[status].label
        const count = getCount(status)

        return (
          <ToggleGroupItem key={value} value={value} className="shrink-0">
            <span>{label}</span>
            <Badge variant="secondary" className="pointer-events-none">
              {count}
            </Badge>
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
