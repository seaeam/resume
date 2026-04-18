import { CheckSquare, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { deleteCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { TRACKER_PRIMARY_ACTION_TEXT } from '../../const'
import useTrackerStore from '../../store'
import { filterJobs, getTrackerErrorMessage } from '../../utils'
import { ViewToggle } from './view-toggle'

export default function TrackerHeader() {
  const {
    jobs,
    loading,
    isSelectMode,
    selectedIds,
    selectAll,
    enterSelectMode,
    exitSelectMode,
    removeJobs,
    openAddDrawer,
    filterStatus,
    searchKeyword,
    setSearchKeyword,
  } = useTrackerStore()
  const jobCount = jobs.length
  const selectableCount = filterJobs(jobs, filterStatus, searchKeyword).length
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
    <header className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">求职跟进</h1>
          {loading
            ? <Skeleton className="h-4 w-16" />
            : (
                <span className="text-sm text-muted-foreground">
                  共
                  <span className="mx-1 font-semibold text-foreground">{jobCount}</span>
                  个职位
                </span>
              )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 lg:w-72 lg:flex-none">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchKeyword}
              placeholder="搜索公司 / 岗位 / 城市"
              className="pl-8"
              onChange={e => setSearchKeyword(e.target.value)}
            />
          </div>
          <ViewToggle />
          <Button
            variant={isSelectMode ? 'secondary' : 'outline'}
            size="icon"
            aria-label={isSelectMode ? '退出批量管理' : '批量管理'}
            title={isSelectMode ? '退出批量管理' : '批量管理'}
            onClick={isSelectMode ? exitSelectMode : enterSelectMode}
          >
            <CheckSquare />
          </Button>
          <Button onClick={openAddDrawer}>
            <Plus />
            {TRACKER_PRIMARY_ACTION_TEXT}
          </Button>
        </div>
      </div>

      {isSelectMode && (
        <div className={cn(
          'flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm',
          selectedCount > 0 && 'border-primary/40 bg-primary/5',
        )}
        >
          <span className="font-medium">
            已选
            <span className="mx-1 text-primary">{selectedCount}</span>
            /
            {' '}
            {selectableCount}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7"
            onClick={selectAll}
          >
            {selectedCount === selectableCount && selectableCount > 0 ? '取消全选' : '全选当前筛选'}
          </Button>
          {selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="ml-auto h-7"
              onClick={() => handleDeleteSelectedJobs()}
            >
              <Trash2 />
              删除选中
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-7', selectedCount > 0 ? '' : 'ml-auto')}
            onClick={exitSelectMode}
          >
            <X />
            退出
          </Button>
        </div>
      )}
    </header>
  )
}
