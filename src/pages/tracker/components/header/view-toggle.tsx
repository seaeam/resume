import type { ViewMode } from '../../types'
import { Kanban, List } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useTrackerStore from '../../store'

export function ViewToggle() {
  const { viewMode, setViewMode } = useTrackerStore()

  return (
    <Tabs
      value={viewMode}
      className="w-full sm:w-auto"
      onValueChange={(value) => {
        if (value)
          setViewMode(value as ViewMode)
      }}
    >
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="list" aria-label="切换到列表视图" className="gap-1.5">
          <List data-icon="inline-start" />
          列表
        </TabsTrigger>
        <TabsTrigger value="board" aria-label="切换到看板视图" className="gap-1.5">
          <Kanban data-icon="inline-start" />
          看板
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
