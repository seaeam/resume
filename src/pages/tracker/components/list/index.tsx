import { Skeleton } from '@/components/ui/skeleton'
import useTrackerStore from '../../store'
import { CreateJobCard } from './create-job-card'
import { JobCard } from './job-card'

export default function ListView() {
  const { jobs, loading, filterStatus } = useTrackerStore()

  const filteredJobs = filterStatus
    ? jobs.filter(job => job.status === filterStatus)
    : jobs

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (filterStatus && filteredJobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">当前暂无跟进</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredJobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
      {!filterStatus && <CreateJobCard />}
    </div>
  )
}
