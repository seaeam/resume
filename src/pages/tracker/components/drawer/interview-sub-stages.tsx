import type { InterviewSubStage } from '../../types'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SubStageItem } from './sub-stage-item'

interface InterviewSubStagesProps {
  subStages: InterviewSubStage[]
  openSubStages: Set<string>
  currentStatus: string
  saving: boolean
  onAddSubStage: () => void
  onDeleteSubStage: (id: string) => void
  onUpdateSubStage: (id: string, updates: Partial<InterviewSubStage>) => void
  onToggleSubStage: (id: string) => void
}

export function InterviewSubStages({
  subStages,
  openSubStages,
  currentStatus,
  saving,
  onAddSubStage,
  onDeleteSubStage,
  onUpdateSubStage,
  onToggleSubStage,
}: InterviewSubStagesProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm text-muted-foreground block">面试轮次</label>
      <div className="space-y-2">
        {subStages.map((subStage) => {
          const isOpen = openSubStages.has(subStage.id)

          return (
            <SubStageItem
              key={subStage.id}
              subStage={subStage}
              isOpen={isOpen}
              onToggle={() => onToggleSubStage(subStage.id)}
              onUpdate={updates => onUpdateSubStage(subStage.id, updates)}
              onDelete={() => onDeleteSubStage(subStage.id)}
            />
          )
        })}
      </div>

      {/* Add interview round button */}
      <Button
        type="button"
        variant="outline"
        onClick={onAddSubStage}
        disabled={
          saving
          || currentStatus !== '进行中'
          || (subStages.length > 0
            && subStages[subStages.length - 1]?.status !== '已完成')
        }
        className="w-full"
      >
        <Plus className="size-4 mr-2" />
        添加面试轮次
      </Button>
    </div>
  )
}
