import type { JobApplication } from '../../types'
import { ArrowRight, Building2, ExternalLink, MoreHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { deleteCompany, updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, getTrackerErrorMessage, getTrackerNextAction } from '../../utils'

interface JobTableProps {
  jobs: JobApplication[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr)
    return '—'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JobTable({ jobs }: JobTableProps) {
  const {
    isSelectMode,
    selectedIds,
    toggleSelect,
    selectAll,
    openJobDrawer,
    syncJob,
    restoreJobsSnapshot,
    removeJobs,
  } = useTrackerStore()

  const allSelected = jobs.length > 0 && jobs.every(job => selectedIds.has(job.id))

  const handleStatusChange = async (job: JobApplication, newStatus: JobApplication['status']) => {
    if (job.status === newStatus)
      return
    const previousState = useTrackerStore.getState()
    const updatedStageDetails = autoCompleteStages(job.status, newStatus, job.stage_details, true)
    const optimisticJob = { ...job, status: newStatus, stage_details: updatedStageDetails }

    syncJob(optimisticJob)

    try {
      const savedJob = await updateCompany(job.id, optimisticJob)
      syncJob(savedJob)
      if (newStatus === 'offer')
        toast.success('Offer🎉')
      else if (newStatus === 'rejected')
        toast.error('终止流程')
    }
    catch (error) {
      restoreJobsSnapshot({
        jobs: previousState.jobs,
        selectedJob: previousState.selectedJob,
      })
      toast.error('更新状态失败', { description: getTrackerErrorMessage(error) })
    }
  }

  const handleDelete = async (job: JobApplication) => {
    try {
      await deleteCompany(job.id)
      removeJobs([job.id])
      toast.success('已删除')
    }
    catch (error) {
      console.error('Failed to delete job:', error)
      toast.error('删除失败', { description: getTrackerErrorMessage(error) })
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {isSelectMode && (
                <th className="w-10 px-3 py-2.5 text-left">
                  <Checkbox
                    checked={allSelected}
                    aria-label="选择全部"
                    onCheckedChange={() => selectAll()}
                  />
                </th>
              )}
              <th className="px-3 py-2.5 text-left font-medium">公司 / 职位</th>
              <th className="px-3 py-2.5 text-left font-medium">地点</th>
              <th className="px-3 py-2.5 text-left font-medium">薪资</th>
              <th className="px-3 py-2.5 text-left font-medium">状态</th>
              <th className="px-3 py-2.5 text-left font-medium">更新时间</th>
              <th className="px-3 py-2.5 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => {
              const isSelected = selectedIds.has(job.id)
              const statusConfig = APPLICATION_STATUS_CONFIG[job.status]
              const nextAction = getTrackerNextAction(job)
              const handleRowClick = () => {
                if (isSelectMode)
                  toggleSelect(job.id)
                else openJobDrawer(job)
              }
              return (
                <tr
                  key={job.id}
                  onClick={handleRowClick}
                  className={cn(
                    'group cursor-pointer border-t transition-colors hover:bg-muted/40',
                    isSelected && 'bg-primary/5',
                  )}
                >
                  {isSelectMode && (
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(job.id)}
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {job.company_logo
                          ? <img src={job.company_logo} alt={job.company} className="size-5 object-contain" />
                          : <Building2 className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-foreground">{job.position}</div>
                        <div className="truncate text-xs text-muted-foreground">{job.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">{job.location || '—'}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{job.salary || '—'}</td>
                  <td className="px-3 py-2.5">
                    <Badge className={cn('rounded-full border-0 px-2 py-0.5 text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDate(job.updated_at)}</td>
                  <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {nextAction.targetStatus && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1 px-2 text-xs"
                          onClick={() => handleStatusChange(job, nextAction.targetStatus!)}
                        >
                          {nextAction.label}
                          <ArrowRight />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="更多操作">
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                          <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => openJobDrawer(job)}>
                              查看详情
                            </DropdownMenuItem>
                            {job.job_url && (
                              <DropdownMenuItem asChild>
                                <a href={job.job_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink data-icon="inline-start" />
                                  打开 JD
                                </a>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuGroup>
                            {APPLICATION_STATUS_ORDER.filter(status => status !== job.status).map(status => (
                              <DropdownMenuItem key={status} onClick={() => handleStatusChange(job, status)}>
                                标记为
                                {APPLICATION_STATUS_CONFIG[status].label}
                              </DropdownMenuItem>
                            ))}
                            {job.status !== 'rejected' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(job, 'rejected')}>
                                终止流程
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => handleDelete(job)}>
                            <Trash2 data-icon="inline-start" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
