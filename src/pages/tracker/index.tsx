import type { ApplicationStatus, JobApplication } from './types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { BoardView } from './components/board-view'
import { AddJobDrawer, JobDrawer } from './components/drawer'
import { JobCard } from './components/job-card'
import { ViewToggle } from './components/view-toggle'
import useTrackerStore from './store'

function Tracker() {
  const {
    jobs,
    viewMode,
    setViewMode,
    selectedIds,
    isSelectMode,
    init,
    updateJobStatus,
    updateJob,
    addJob,
    deleteSelectedJobs,
    enterSelectMode,
    exitSelectMode,
    toggleSelect,
    selectAll,
  } = useTrackerStore()

  // Drawer UI 状态 - 组件本地管理
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addDrawerOpen, setAddDrawerOpen] = useState(false)

  useEffect(() => {
    init()
  }, [init])

  // Drawer 操作
  const handleJobClick = (job: JobApplication) => {
    if (isSelectMode)
      return // 选择模式下不打开 Drawer
    setSelectedJob(job)
    setDrawerOpen(true)
  }

  const handleJobUpdate = (job: JobApplication) => {
    updateJob(job)
    setSelectedJob(job) // 同步更新本地 selectedJob
  }

  const handleStatusChange = (jobId: string, status: ApplicationStatus) => {
    updateJobStatus(jobId, status)
    // 如果当前 Drawer 显示的是这个 job，需要同步更新 selectedJob
    if (selectedJob?.id === jobId) {
      const updatedJob = jobs.find(j => j.id === jobId)
      if (updatedJob) {
        setSelectedJob({ ...updatedJob, status })
      }
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
        {/* 标题区域 */}
        <header>
          <h1 className="text-2xl font-bold">你的求职跟进</h1>
          <p className="text-muted-foreground">
            共
            {' '}
            {jobs.length}
            {' '}
            个职位，跟踪你的求职投递状态
          </p>
        </header>

        {/* 操作栏：按钮+视图切换 */}
        <div className="flex items-center justify-between gap-4">
          {/* 左侧：操作按钮组 */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Manage Jobs 按钮 / N Jobs Selected */}
            {isSelectMode
              ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      'gap-2',
                      selectedIds.size > 0 && 'border-primary bg-primary/10 text-primary',
                    )}
                    onClick={selectAll}
                  >
                    <Checkbox
                      checked={selectedIds.size === jobs.length && jobs.length > 0}
                      className="size-4"
                    />
                    {selectedIds.size}
                    {' '}
                    Jobs Selected
                  </Button>
                )
              : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={enterSelectMode}
                  >
                    Manage Jobs
                  </Button>
                )}
            {/* 竖线分隔符 */}
            <div className="h-6 w-px bg-border" />
            {/* 新建 + 导入 */}
            <Button onClick={() => setAddDrawerOpen(true)}>新建看板</Button>
            <Button variant="outline" onClick={() => toast.warning('功能开发中')}>
              导入简历
            </Button>
            {/* 选择模式下显示：Delete + Done */}
            {isSelectMode && (
              <>
                {selectedIds.size > 0 && (
                  <Button variant="destructive" size="sm" onClick={deleteSelectedJobs}>
                    Delete
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={exitSelectMode}>
                  × Done
                </Button>
              </>
            )}
          </div>
          {/* 右侧：视图切换 - 独立在右侧，不会被挤压 */}
          <div className="shrink-0">
            <ViewToggle value={viewMode} onModeChange={setViewMode} />
          </div>
        </div>

        {/* 主模块区域 - 根据视图渲染 */}
        <main className="w-full overflow-hidden">
          {viewMode === 'list'
            ? (
                <div className="flex flex-col gap-4">
                  {jobs.map(job => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onStatusChange={handleStatusChange}
                      onJobClick={handleJobClick}
                      isSelectMode={isSelectMode}
                      isSelected={selectedIds.has(job.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              )
            : (
                <BoardView
                  jobs={jobs}
                  onStatusChange={handleStatusChange}
                  onJobClick={handleJobClick}
                  isSelectMode={isSelectMode}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              )}
        </main>
      </div>

      <JobDrawer
        job={selectedJob}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onJobUpdate={handleJobUpdate}
      />

      <AddJobDrawer
        open={addDrawerOpen}
        onOpenChange={setAddDrawerOpen}
        onAdd={addJob}
      />
    </>
  )
}

export default Tracker
