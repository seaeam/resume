import type { ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SOURCE_META } from '@/pages/history/const'
import { getVersionTitle } from '@/pages/history/utils'
import { formatDateTime, formatRelativeTime } from '@/utils/date'

export function VersionListItem({
  version,
  mobile,
  onRestore,
  onPreview,
}: {
  version: ResumeHistoryVersionRecord
  mobile: boolean
  onRestore: (versionId: number) => void
  onPreview: (versionId: number) => void
}) {
  const sourceMeta = SOURCE_META[version.source_type]
  const SourceIcon = sourceMeta.icon

  return (
    <article
      className={cn(
        'rounded-2xl border border-border/70 bg-background/95 p-3',
        'transition-colors hover:border-border hover:bg-muted/20',
        mobile ? 'space-y-3' : 'flex items-start gap-3',
      )}
    >
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            V
            {version.version_no}
          </Badge>
          <Badge className={sourceMeta.badgeClassName}>
            <SourceIcon data-icon="inline-start" />
            {sourceMeta.label}
          </Badge>
          {version.milestone_name?.trim() && (
            <Badge variant="outline" className="border-primary/20 text-primary">
              {version.milestone_name.trim()}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="truncate text-sm font-semibold text-foreground">
            {getVersionTitle(version)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(version.created_at)}
            {' '}
            ·
            {' '}
            {formatDateTime(version.created_at)}
          </div>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">
          {version.description?.trim() || '暂无版本说明'}
        </p>
      </div>

      <div className={cn('shrink-0 gap-2', mobile ? 'grid grid-cols-2' : 'flex w-36 flex-col')}>
        <Button size="sm" onClick={() => onRestore(version.id)}>
          <RotateCcw data-icon="inline-start" />
          回滚
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPreview(version.id)}>
          预览
        </Button>
      </div>
    </article>
  )
}
