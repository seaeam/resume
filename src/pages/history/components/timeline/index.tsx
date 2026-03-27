import type { HistorySelection } from '../../types'
import { LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { formatRelativeTime } from '@/utils/date'
import { useOverflowState } from '../../hooks/use-overflow-state'
import useHistoryStore from '../../store'
import { groupVersionsByDay } from '../../utils'
import CurrentVersionCard from './current-version-card'
import TimelineEmptyState from './empty-state'
import TimelineLoadingState from './loading-state'
import VersionCard from './version-card'

interface HistoryTimelineProps {
  selectedEntry: HistorySelection
  onSelectEntry: (target: HistorySelection) => void
}

export default function HistoryTimeline({
  selectedEntry,
  onSelectEntry,
}: HistoryTimelineProps) {
  const { currentResume, versions, loading } = useHistoryStore()
  const { ref: scrollRef, overflowing } = useOverflowState<HTMLDivElement>()

  const groups = groupVersionsByDay(versions)
  const timelineCountLabel = versions.length === 0 ? '暂无版本记录' : `${versions.length} 条版本记录`

  return (
    <Card className="flex min-h-0 flex-col gap-0 overflow-hidden border-border/70 bg-background/95 py-0 shadow-none max-h-[72dvh] md:max-h-[min(78vh,920px)] lg:sticky lg:top-20 lg:h-[calc(100vh-7rem)] lg:max-h-[920px]">
      <CardHeader className="gap-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{timelineCountLabel}</Badge>
          {loading && (
            <Badge variant="secondary">
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
              正在加载
            </Badge>
          )}
          {currentResume?.updatedAt && (
            <Badge variant="outline">
              当前内容更新于
              {' '}
              {formatRelativeTime(currentResume.updatedAt)}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <CardTitle>版本时间线</CardTitle>
          <CardDescription>
            {loading ? '正在加载这份简历的版本记录。' : '左侧选择版本，右侧查看内容、编辑说明或恢复版本。'}
          </CardDescription>
        </div>
      </CardHeader>
      <Separator />

      <CardContent
        ref={scrollRef}
        className={cn(
          'min-h-0 flex-1 px-0 py-0',
          overflowing
            ? 'scrollbar-gutter-stable scrollbar-thin-subtle overflow-y-auto overscroll-contain'
            : 'overflow-hidden',
        )}
      >
        <div className="flex flex-col gap-5 p-4 sm:p-5">
          <section className="flex flex-col gap-3">
            <div className="px-1 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              当前版本
            </div>
            <CurrentVersionCard
              selected={selectedEntry === 'current'}
              onSelectEntry={onSelectEntry}
            />
          </section>

          <Separator />

          <section className="flex flex-col gap-4">
            <div className="px-1 text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              历史版本
            </div>

            {loading
              ? (
                  <TimelineLoadingState />
                )
              : groups.length > 0
                ? (
                    <div className="flex flex-col gap-7">
                      {groups.map(group => (
                        <section key={group.label} className="flex flex-col gap-4">
                          <div className="flex items-center gap-3">
                            <Separator className="flex-1" />
                            <span className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                              {group.label}
                            </span>
                            <Separator className="flex-1" />
                          </div>

                          <div className="flex flex-col gap-3 border-l border-dashed border-border/80 pl-5">
                            {group.items.map((version, index) => (
                              <VersionCard
                                key={version.id}
                                version={version}
                                index={index}
                                selected={selectedEntry === version.id}
                                onSelectEntry={onSelectEntry}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )
                : (
                    <TimelineEmptyState currentResume={currentResume} />
                  )}
          </section>
        </div>
      </CardContent>
    </Card>
  )
}
