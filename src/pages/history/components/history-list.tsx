import type { HistoryEntry } from '../type'
import { Clock, Eye, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatTime } from '../utils'

interface HistoryListProps {
  entries: HistoryEntry[]
  onPreview: (entry: HistoryEntry) => void
  onRestore: (entry: HistoryEntry) => void
}

export function HistoryList({ entries, onPreview, onRestore }: HistoryListProps) {
  const total = entries.length

  return (
    <div className="relative">
      {/* 时间线 */}
      <div className="absolute left-[7px] top-4 bottom-4 w-0.5 bg-border" />

      <div className="space-y-3">
        {entries.map((entry, index) => {
          const isLatest = index === 0
          const versionNumber = total - index

          return (
            <div key={entry.id} className="group relative flex gap-4">
              {/* 时间线圆点 - 悬停时变色 */}
              <div
                className={`relative z-10 mt-4 h-4 w-4 rounded-full border-2 shrink-0 transition-all duration-200 ${
                  isLatest
                    ? 'bg-primary border-primary'
                    : 'bg-background border-muted-foreground/40 group-hover:border-primary group-hover:bg-primary/20'
                }`}
              />

              {/* 内容卡片 - 悬停高亮 */}
              <div
                className={`flex-1 p-4 border rounded-lg transition-all duration-200 ${
                  isLatest
                    ? 'border-primary/50 bg-primary/5'
                    : 'hover:border-primary/30 hover:bg-muted/50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {isLatest ? '当前版本' : `版本 ${versionNumber}`}
                      </span>
                      {isLatest && (
                        <span className="text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          最新
                        </span>
                      )}
                      {entry.changeCount && entry.changeCount > 1 && (
                        <span className="text-xs text-muted-foreground">
                          (
                          {entry.changeCount}
                          {' '}
                          次编辑)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatTime(entry.time)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPreview(entry)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      预览
                    </Button>
                    {!isLatest && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRestore(entry)}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        恢复
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
