import { Skeleton } from '@/components/ui/skeleton'
import useTrackerStore from '../../store'
import { JobCard } from './job-card'

export default function ListView() {
  const { jobs, loading } = useTrackerStore()

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg font-medium">暂无职位</p>
        <p className="text-sm mt-1">点击「新建看板」添加你的第一个职位跟踪</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
