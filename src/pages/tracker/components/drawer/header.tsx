import { ExternalLink, FileText, MapPin, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { getTrackerMetaSummary, getTrackerNextAction, getTrackerProgressHint } from '../../utils'

interface DrawerHeaderInfoProps {
  onEdit?: () => void
}

export default function DrawerHeaderInfo({ onEdit }: DrawerHeaderInfoProps) {
  const { selectedJob: job } = useTrackerStore()

  if (!job)
    return null

  const statusConfig = APPLICATION_STATUS_CONFIG[job.status]
  const nextAction = getTrackerNextAction(job)
  const progressHint = getTrackerProgressHint(job)
  const metaSummary = getTrackerMetaSummary(job)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" />
          下一步
          {nextAction.label}
        </div>
        <Badge className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
          {statusConfig.label}
        </Badge>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
        <p className="text-sm font-medium leading-6 text-foreground">{progressHint}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">工作地点</p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-medium">
            <MapPin className="size-4 text-muted-foreground" />
            {job.location}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">投递简历</p>
          <p className="mt-1 inline-flex items-center gap-1.5 font-medium">
            <FileText className="size-4 text-muted-foreground" />
            {metaSummary.hasResume ? '已绑定' : '未绑定'}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">薪资信息</p>
          <p className="mt-1 font-medium">{job.salary || '未填'}</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-3">
          <p className="text-xs text-muted-foreground">职位链接</p>
          <p className="mt-1 font-medium">{job.job_url ? '已保存' : '未填'}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" className="rounded-xl" onClick={onEdit}>
          编辑信息
        </Button>
        {job.job_url && (
          <Button variant="ghost" asChild className="rounded-xl">
            <a href={job.job_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              打开 JD
            </a>
          </Button>
        )}
      </div>
    </div>
  )
}
