import type { JobApplication } from '../../types'
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, FileText, Link2, MapPin, MoreVertical, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { deleteCompany, updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, getTrackerErrorMessage, getTrackerMetaSummary, getTrackerNextAction, getTrackerProgressHint } from '../../utils'

interface JobCardProps {
  job: JobApplication
}

function formatDate(dateStr: string | null): string {
  if (!dateStr)
    return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JobCard({ job }: JobCardProps) {
  const { isSelectMode, selectedIds, toggleSelect, openJobDrawer, syncJob, restoreJobsSnapshot, removeJobs } = useTrackerStore()
  const isSelected = selectedIds.has(job.id)

  const statusConfig = APPLICATION_STATUS_CONFIG[job.status]
  const currentStage = job.stage_details.find(s => s.stage === job.status)
  const stageDate = currentStage?.start_date ? formatDate(currentStage.start_date) : formatDate(job.updated_at)
  const nextAction = getTrackerNextAction(job)
  const progressHint = getTrackerProgressHint(job)
  const metaSummary = getTrackerMetaSummary(job)

  const handleClick = () => {
    if (isSelectMode) {
      toggleSelect(job.id)
    }
    else {
      openJobDrawer(job)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteCompany(job.id)
      removeJobs([job.id])
      toast.success('删除成功')
    }
    catch (error) {
      console.error('Failed to delete job:', error)
      toast.error('删除失败', { description: getTrackerErrorMessage(error) })
    }
  }

  const handleStatusChange = async (newStatus: JobApplication['status']) => {
    const previousState = useTrackerStore.getState()
    const currentJob = previousState.jobs.find(current => current.id === job.id)

    if (!currentJob)
      return

    const updatedStageDetails = autoCompleteStages(currentJob.status, newStatus, currentJob.stage_details, true)
    const optimisticJob = { ...currentJob, status: newStatus, stage_details: updatedStageDetails }

    syncJob(optimisticJob)

    try {
      const savedJob = await updateCompany(job.id, optimisticJob)
      syncJob(savedJob)

      if (newStatus === 'offer') {
        toast.success('Offer🎉')
      }
      else if (newStatus === 'rejected') {
        toast.error('终止流程')
      }
    }
    catch (error) {
      restoreJobsSnapshot({
        jobs: previousState.jobs,
        selectedJob: previousState.selectedJob,
      })
      toast.error('更新状态失败', { description: getTrackerErrorMessage(error) })
    }
  }

  const handlePrimaryAction = () => {
    if (nextAction.targetStatus) {
      handleStatusChange(nextAction.targetStatus)
      return
    }

    openJobDrawer(job)
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer overflow-hidden rounded-3xl border border-border/70 bg-card/90 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg',
        isSelected && 'border-primary bg-primary/5 shadow-primary/10',
      )}
      onClick={handleClick}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {job.company_logo
                ? <img src={job.company_logo} alt={job.company} className="size-7 object-contain" />
                : <Building2 className="size-5" />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{job.company}</p>
              <p className="truncate text-xs text-muted-foreground">{stageDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Badge className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            {isSelectMode
              ? (
                  <Checkbox
                    checked={isSelected}
                    className="size-5"
                    onClick={e => e.stopPropagation()}
                    onCheckedChange={() => toggleSelect(job.id)}
                  />
                )
              : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-full text-muted-foreground"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openJobDrawer(job)}>
                          查看详情
                        </DropdownMenuItem>
                        {APPLICATION_STATUS_ORDER.filter(status => status !== job.status).map(status => (
                          <DropdownMenuItem key={status} onClick={() => handleStatusChange(status)}>
                            标记为
                            {APPLICATION_STATUS_CONFIG[status].label}
                          </DropdownMenuItem>
                        ))}
                        {job.status !== 'rejected' && (
                          <DropdownMenuItem onClick={() => handleStatusChange('rejected')}>
                            终止流程
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem variant="destructive" onClick={() => handleDelete()}>
                          <Trash2 data-icon="inline-start" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="line-clamp-1 text-xl font-semibold tracking-tight">{job.position}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
            {job.salary && (
              <span className="inline-flex items-center gap-1.5">
                <BriefcaseBusiness className="size-3.5" />
                {job.salary}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <CalendarClock className="size-3.5" />
            {stageDate}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
            metaSummary.hasResume ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground',
          )}
          >
            <FileText className="size-3.5" />
            {metaSummary.hasResume ? '简历' : '未绑'}
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 rounded-full px-2.5 py-1',
            metaSummary.hasJobUrl ? 'bg-sky-50 text-sky-700' : 'bg-muted text-muted-foreground',
          )}
          >
            <Link2 className="size-3.5" />
            {metaSummary.hasJobUrl ? 'JD' : '无 JD'}
          </span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-muted/40 px-3.5 py-3">
          <p className="text-sm font-medium leading-6 text-foreground">{progressHint}</p>
        </div>
      </CardContent>

      <CardFooter className="border-t border-border/60 px-5 py-4">
        <div className="flex w-full gap-2" onClick={e => e.stopPropagation()}>
          <Button
            className="flex-1 gap-2 rounded-xl"
            variant={nextAction.emphasize === 'primary' ? 'default' : 'outline'}
            onClick={handlePrimaryAction}
          >
            <ArrowRight className="size-4" />
            {nextAction.label}
          </Button>
          <Button variant="outline" className="rounded-xl px-4" onClick={() => openJobDrawer(job)}>
            详情
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
