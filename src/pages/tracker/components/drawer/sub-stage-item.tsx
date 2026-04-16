import type { InterviewSubStage, StageStatus } from '../../types'
import dayjs from 'dayjs'
import { CalendarIcon, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { STAGE_STATUS_COLORS, STAGE_STATUS_OPTIONS } from '../../const'

interface SubStageItemProps {
  subStage: InterviewSubStage
  isOpen: boolean
  onToggle: () => void
  onUpdate: (updates: Partial<InterviewSubStage>) => void
  onDelete: () => void
}

export function SubStageItem({
  subStage,
  isOpen,
  onToggle,
  onUpdate,
  onDelete,
}: SubStageItemProps) {
  const subColors = STAGE_STATUS_COLORS[subStage.status]
  const subDate = subStage.start_date ? dayjs(subStage.start_date).toDate() : undefined

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="border rounded-lg p-3 space-y-3">
        {/* Title row */}
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <button type="button" className="hover:opacity-70">
              {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
          </CollapsibleTrigger>
          <Input
            value={subStage.label}
            onChange={e => onUpdate({ label: e.target.value })}
            className="h-7 flex-1 text-sm font-medium"
            placeholder="轮次名称"
          />
          <Badge variant="outline" className={cn(subColors.bg, subColors.text, 'text-xs')}>
            {subStage.status}
          </Badge>
          <button
            type="button"
            onClick={onDelete}
            className="text-destructive hover:opacity-70"
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <CollapsibleContent className="space-y-3 pt-1">
          {/* Sub-stage status selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">状态</label>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'w-full inline-flex items-center justify-between px-3 py-2 rounded-md text-sm border',
                    'hover:bg-muted transition-colors',
                    subColors.bg,
                    subColors.text,
                    subColors.border,
                  )}
                >
                  <span className="inline-flex items-center gap-2">
                    <span className={cn('size-2 rounded-full', subColors.bg, 'border', subColors.border)} />
                    {subStage.status}
                  </span>
                  <ChevronDown className="size-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-32 p-1" align="start">
                <div className="flex flex-col">
                  {STAGE_STATUS_OPTIONS.map((status) => {
                    const colors = STAGE_STATUS_COLORS[status]
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onUpdate({ status: status as StageStatus })}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted"
                      >
                        <span className={cn('size-2 rounded-full', colors.bg, 'border', colors.border)} />
                        <span className={colors.text}>{status}</span>
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Sub-stage start date - only show for '进行中'/'已完成' */}
          {subStage.status !== '待处理' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">开始时间</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9 text-sm',
                      !subDate && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 size-3.5" />
                    {subDate ? dayjs(subDate).format('YYYY年M月D日') : '选择日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={subDate}
                    onSelect={(date) => {
                      onUpdate({
                        start_date: date ? dayjs(date).format('YYYY-MM-DD') : null,
                      })
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Interview notes - only show for '进行中'/'已完成' */}
          {subStage.status !== '待处理' && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">面经笔记</label>
              <SimpleEditor
                content={subStage.notes || ''}
                onChange={editor => onUpdate({ notes: editor.getHTML() })}
              />
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}
