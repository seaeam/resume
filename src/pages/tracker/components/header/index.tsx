import { Plus, Rows3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { TRACKER_BATCH_TOOLBAR_LABEL, TRACKER_PRIMARY_ACTION_TEXT } from '../../const'
import useTrackerStore from '../../store'
import { getTrackerErrorMessage } from '../../utils'
import { ViewToggle } from '../view-toggle'

export default function TrackerHeader() {
  const { jobs, loading, isSelectMode, selectedIds, selectAll, enterSelectMode, exitSelectMode, removeJobs, openAddDrawer, filterStatus } = useTrackerStore()
  const jobCount = jobs.length
  const selectableCount = filterStatus
    ? jobs.filter(job => job.status === filterStatus).length
    : jobCount
  const selectedCount = selectedIds.size

  const handleDeleteSelectedJobs = async () => {
    const { selectedIds: currentSelectedIds } = useTrackerStore.getState()
    if (currentSelectedIds.size === 0)
      return

    const ids = new Set(currentSelectedIds)

    try {
      await Promise.all(Array.from(ids).map(id => deleteCompany(id)))
      removeJobs(ids)
      toast.success(`已删除 ${ids.size} 个职位`)
    }
    catch (error) {
      console.error('Failed to delete jobs:', error)
      toast.error('删除失败', { description: getTrackerErrorMessage(error) })
    }
  }

  return (
    <>
      <header className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
              <Rows3 className="size-3.5" />
              求职流程工作台
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">你的求职跟进</h1>
              {loading
                ? <Skeleton className="mt-2 h-5 w-48" />
                : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      当前共
                      {' '}
                      <span className="font-semibold text-foreground">{jobCount}</span>
                      {' '}
                      个职位，优先在列表中快速推进状态，需要补充细节时再进入详情。
                    </p>
                  )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button className="gap-2 rounded-xl shadow-sm" onClick={openAddDrawer}>
              <Plus className="size-4" />
              {TRACKER_PRIMARY_ACTION_TEXT}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground/80">
              {TRACKER_BATCH_TOOLBAR_LABEL}
            </span>
          {isSelectMode
            ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'gap-2 rounded-xl',
                      selectedCount > 0 && 'border-primary bg-primary/10 text-primary',
                    )}
                    onClick={selectAll}
                  >
                    <Checkbox
                      checked={selectedCount === selectableCount && selectableCount > 0}
                      className="size-4"
                    />
                    已选
                    {' '}
                    {selectedCount}
                    {' '}
                    个职位
                  </Button>
                  {selectedCount > 0 && (
                    <Button variant="destructive" size="sm" className="gap-2 rounded-xl" onClick={() => void handleDeleteSelectedJobs()}>
                      <Trash2 className="size-4" />
                      删除
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={exitSelectMode}>
                    退出批量管理
                  </Button>
                </>
              )
            : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 rounded-xl"
                  onClick={enterSelectMode}
                >
                  管理职位
                </Button>
              )}
        </div>
        <div className="shrink-0 self-start lg:self-auto">
          <ViewToggle />
        </div>
        </div>
      </header>
    </>
  )
}
