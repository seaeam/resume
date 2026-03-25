// 视图切换
import { Kanban, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import useTrackerStore from '../store'

export function ViewToggle() {
  const { viewMode, setViewMode } = useTrackerStore()

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border p-1">
      {/* List */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm transition-colors',
          viewMode === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted',
        )}
        onClick={() => setViewMode('list')}
      >
        <List className="size-4 mr-1.5" />
        列表
      </button>
      {/* Board */}
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm transition-colors',
          viewMode === 'board'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted',
        )}
        onClick={() => setViewMode('board')}
      >
        <Kanban className="size-4 mr-1.5" />
        看板
      </button>
    </div>
  )
}
