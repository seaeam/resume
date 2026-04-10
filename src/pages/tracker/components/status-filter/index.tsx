import type { ApplicationStatus } from '../../types'
import { Badge } from '@/components/ui/badge'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { ALL_FILTER_STATUSES } from './const'

export default function StatusFilter() {
  const { jobs } = useTrackerStore()

  const getCount = (status: ApplicationStatus | null) => {
    if (status === null)
      return jobs.length
    return jobs.filter(j => j.status === status).length
  }

  return (
    <div className="overflow-x-auto">
      <TabsList className="w-max">
        {ALL_FILTER_STATUSES.map((status) => {
          const value = status ?? 'all'
          const label = status === null ? '全部' : APPLICATION_STATUS_CONFIG[status].label
          const count = getCount(status)

          return (
            <TabsTrigger key={value} value={value} className="flex-none gap-2">
              <span>{label}</span>
              <Badge variant="secondary" className="pointer-events-none">
                {count}
              </Badge>
            </TabsTrigger>
          )
        })}
      </TabsList>
    </div>
  )
}
