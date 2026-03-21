import type { HistoryCurrentResume } from '../../types'
import { Sparkles } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

interface TimelineEmptyStateProps {
  currentResume: HistoryCurrentResume | null
}

export default function TimelineEmptyState({ currentResume }: TimelineEmptyStateProps) {
  return (
    <Empty className="min-h-72 border border-dashed bg-muted/15">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Sparkles />
        </EmptyMedia>
        <EmptyTitle>还没有历史版本</EmptyTitle>
        <EmptyDescription>
          {currentResume
            ? '保存关键修改节点后，这里会按时间顺序显示所有版本。'
            : '请先选择一份云端简历。'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
