import { FilterX, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { CreateJobCard } from './create-job-card'
import { JobCard } from './job-card'

const LIST_SKELETON_KEYS = [
  'list-skeleton-1',
  'list-skeleton-2',
  'list-skeleton-3',
  'list-skeleton-4',
  'list-skeleton-5',
  'list-skeleton-6',
] as const

export default function ListView() {
  const { jobs, loading, filterStatus, setFilterStatus, openAddDrawer } = useTrackerStore()

  const filteredJobs = filterStatus
    ? jobs.filter(job => job.status === filterStatus)
    : jobs

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LIST_SKELETON_KEYS.map(key => (
          <Skeleton key={key} className="h-[280px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-card/70 px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            求职流程从这里开始
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">先创建第一条职位记录</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              建议每看到一个想投的岗位就先记进来。后续无论是投递、面试还是终止流程，都能围绕这条记录继续推进。
            </p>
          </div>
          <Button className="rounded-xl" onClick={openAddDrawer}>
            <Plus className="size-4" />
            新增职位
          </Button>
        </div>
      </div>
    )
  }

  if (filterStatus && filteredJobs.length === 0) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-12 text-center shadow-sm">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {APPLICATION_STATUS_CONFIG[filterStatus].label}
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight">当前筛选下还没有职位</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              可以先返回全部职位继续推进，或者直接新增一条记录。
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded-xl" onClick={() => setFilterStatus(null)}>
              <FilterX className="size-4" />
              查看全部职位
            </Button>
            <Button className="rounded-xl" onClick={openAddDrawer}>
              <Plus className="size-4" />
              新增职位
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {filterStatus ? APPLICATION_STATUS_CONFIG[filterStatus].label : '全部职位'}
          </p>
          <p className="text-xs text-muted-foreground">
            共
            {' '}
            {filteredJobs.length}
            {' '}
            条记录。优先直接在卡片上推进下一步，只有需要补细节时再进入详情。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filteredJobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
        {!filterStatus && <CreateJobCard />}
      </div>
    </div>
  )
}
