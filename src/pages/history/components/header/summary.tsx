import { Clock3, Flag, History, Layers3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/utils/date'
import useHistoryStore from '../../store'

function SummaryMetric({ icon: Icon, label, value}: {
  icon: typeof History
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

export default function HistoryHeaderSummary() {
  const { currentResume, versions } = useHistoryStore()

  const milestoneCount = versions.filter(version => Boolean(version.milestone_name)).length

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-muted/40 text-primary sm:size-14">
          <History className="size-5" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-2.5 py-1 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              版本记录
            </Badge>
            {currentResume && (
              <Badge variant="secondary" className="max-w-full px-2.5 py-1">
                <Layers3 data-icon="inline-start" />
                <span className="truncate">{currentResume.displayName}</span>
              </Badge>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">历史版本</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              查看简历的版本记录、恢复记录与当前内容。
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:min-w-[360px]">
        <SummaryMetric icon={History} label="已保存" value={`${versions.length} 条`} />
        <SummaryMetric icon={Flag} label="重点版本" value={`${milestoneCount} 个`} />
        <SummaryMetric
          icon={Clock3}
          label="最近更新"
          value={currentResume?.updatedAt ? formatRelativeTime(currentResume.updatedAt) : '暂无'}
        />
      </div>
    </div>
  )
}
