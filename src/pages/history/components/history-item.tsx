import dayjs from 'dayjs'
import { Eye, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface HistoryItemProps {
  index: number
  time: Date | null
  message: string | null
  isLatest: boolean
  onPreview: () => void
  onRestore: () => void
}

export function HistoryItem({
  index,
  time,
  message,
  isLatest,
  onPreview,
  onRestore,
}: HistoryItemProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">
            版本
            {' '}
            {index + 1}
            {isLatest && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                最新
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '未知时间'}
          </div>
          {message && <div className="text-xs text-muted-foreground mt-1">{message}</div>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPreview}>
            <Eye className="h-4 w-4 mr-1" />
            预览
          </Button>
          <Button variant="ghost" size="sm" onClick={onRestore}>
            <RotateCcw className="h-4 w-4 mr-1" />
            恢复
          </Button>
        </div>
      </div>
    </Card>
  )
}
