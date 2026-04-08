import type { ViewMode } from '../../types'
import { Kanban, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import useTrackerStore from '../../store'

export function ViewToggle() {
  const { viewMode, setViewMode } = useTrackerStore()

  return (
    <ToggleGroup
      type="single"
      value={viewMode}
      variant="outline"
      className="w-full sm:w-auto"
      onValueChange={(value) => {
        if (value)
          setViewMode(value as ViewMode)
      }}
    >
      <ToggleGroupItem value="list" aria-label="切换到列表视图">
        <List data-icon="inline-start" />
        列表
      </ToggleGroupItem>
      <ToggleGroupItem value="board" aria-label="切换到看板视图">
        <Kanban data-icon="inline-start" />
        看板
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
