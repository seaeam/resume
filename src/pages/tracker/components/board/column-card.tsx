import type { JobApplication } from '../../types'
import { ArrowRight, Building2, CalendarClock, Link2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, getTrackerErrorMessage, getTrackerMetaSummary, getTrackerNextAction, getTrackerProgressHint } from '../../utils'

interface ColumnCardProps {
  job: JobApplication
}

export function ColumnCard({ job }: ColumnCardProps) {
  const { isSelectMode, selectedIds, toggleSelect, openJobDrawer, syncJob, restoreJobsSnapshot } = useTrackerStore()
  const isSelected = selectedIds.has(job.id)
  const nextAction = getTrackerNextAction(job)
  const progressHint = getTrackerProgressHint(job)
  const metaSummary = getTrackerMetaSummary(job)

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
      void handleStatusChange(nextAction.targetStatus)
      return
    }

    openJobDrawer(job)
  }

  const handleClick = () => {
    if (isSelectMode) {
      toggleSelect(job.id)
    }
    else {
      openJobDrawer(job)
    }
  }

  return (
    <Card
      className={cn(
        'cursor-pointer rounded-2xl border border-border/70 bg-card/90 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        isSelected && 'border-primary bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {job.company_logo
            ? (
                <img src={job.company_logo} alt={job.company} className="size-6 object-contain" />
              )
            : (
                <Building2 className="size-4" />
              )}
        </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{job.company}</p>
                <p className="truncate text-base font-semibold tracking-tight text-foreground">{job.position}</p>
              </div>
              {isSelectMode
                ? (
                    <Checkbox
                      checked={isSelected}
                      className="mt-0.5 size-5"
                      onClick={e => e.stopPropagation()}
                      onCheckedChange={() => toggleSelect(job.id)}
                    />
                  )
                : (
                    <Badge className={cn('rounded-full border-0 px-2 py-1 text-[11px] font-medium', APPLICATION_STATUS_CONFIG[job.status].bgColor, APPLICATION_STATUS_CONFIG[job.status].color)}>
                      {APPLICATION_STATUS_CONFIG[job.status].label}
                    </Badge>
                  )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" />
                最近更新
              </span>
              {metaSummary.hasJobUrl && (
                <span className="inline-flex items-center gap-1 text-sky-700">
                  <Link2 className="size-3.5" />
                  已保存 JD
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
          <p className="text-sm font-medium leading-6 text-foreground">{progressHint}</p>
          {metaSummary.activeSubStageLabel && (
            <p className="mt-1 text-xs text-muted-foreground">
              当前轮次：
              {metaSummary.activeSubStageLabel}
            </p>
          )}
        </div>

        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <Button
            size="sm"
            className="flex-1 rounded-xl"
            variant={nextAction.emphasize === 'primary' ? 'default' : 'outline'}
            onMouseDown={e => e.stopPropagation()}
            onClick={handlePrimaryAction}
          >
            <ArrowRight className="size-4" />
            {nextAction.label}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl px-3"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => openJobDrawer(job)}
          >
            详情
          </Button>
        </div>
      </div>
    </Card>
  )
}
