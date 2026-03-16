import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import useTrackerStore from '../../store'
import { ViewToggle } from '../view-toggle'

export default function TrackerHeader() {
  const {
    jobs,
    loading,
    isSelectMode,
    selectedIds,
    selectAll,
    enterSelectMode,
    exitSelectMode,
    deleteSelectedJobs,
  } = useTrackerStore()

  const jobCount = jobs.length
  const selectedCount = selectedIds.size

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">你的求职跟进</h1>
        {loading
          ? <Skeleton className="h-5 w-48" />
          : (
              <p className="text-muted-foreground">
                共
                {' '}
                {jobCount}
                {' '}
                个职位，跟踪你的求职投递状态
              </p>
            )}
      </header>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {isSelectMode
            ? (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'gap-2',
                    selectedCount > 0 && 'border-primary bg-primary/10 text-primary',
                  )}
                  onClick={selectAll}
                >
                  <Checkbox
                    checked={selectedCount === jobCount && jobCount > 0}
                    className="size-4"
                  />
                  已选
                  {' '}
                  {selectedCount}
                  {' '}
                  个职位
                </Button>
              )
            : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={enterSelectMode}
                >
                  管理职位
                </Button>
              )}
          {isSelectMode && (
            <>
              {selectedCount > 0 && (
                <Button variant="destructive" size="sm" onClick={deleteSelectedJobs}>
                  删除
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                × 完成
              </Button>
            </>
          )}
        </div>
        <div className="shrink-0">
          <ViewToggle />
        </div>
      </div>
    </>
  )
}
