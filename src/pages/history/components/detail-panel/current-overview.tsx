import { Clock3, FileText, History, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { formatRelativeTime } from '@/utils/date'
import { getResumeTypeLabel } from '../../const'
import useHistoryStore from '../../store'
import { getCurrentSyncState } from '../../utils'
import MetricCard from './metric-card'

export default function CurrentOverview() {
  const { currentResume, versions } = useHistoryStore()

  if (!currentResume) {
    return null
  }

  const syncState = getCurrentSyncState(currentResume, versions)

  return (
    <>
      <Card className="gap-4 border-border/70 bg-muted/20 py-5 shadow-none">
        <CardContent className="grid gap-3 px-5 sm:grid-cols-3">
          <MetricCard label="当前模板" value={getResumeTypeLabel(currentResume.type)} icon={FileText} toneClassName="border-primary/10 bg-primary/5" />
          <MetricCard label="历史记录数" value={`${versions.length}`} icon={History} toneClassName="border-secondary bg-secondary/40" />
          <MetricCard
            label="最近更新时间"
            value={currentResume.updatedAt ? formatRelativeTime(currentResume.updatedAt) : '未知'}
            icon={Clock3}
            toneClassName="border-accent bg-accent/40"
          />
        </CardContent>
      </Card>

      <Card className="gap-3 border-border/70 py-5 shadow-none">
        <CardContent className="px-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Info className="size-4 text-primary" />
            状态说明
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {versions.length === 0
              ? '当前简历还没有建立历史节点。建议在每次关键修改、AI 优化前或准备投递前先保存一个版本。'
              : syncState.synced
                ? `当前内容与最近一次保存的 V${syncState.latestVersionNo} 保持一致。`
                : '当前内容和最近一次保存的历史版本不同，建议先保存，再继续后续操作。'}
          </p>
        </CardContent>
      </Card>
    </>
  )
}
