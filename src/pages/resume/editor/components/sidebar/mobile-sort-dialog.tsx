import type { DropResult } from '@hello-pangea/dnd'
import type { ORDERType } from '@/lib/schema'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { ITEMS } from '../../const'

interface MobileSortDialogProps {
  open: boolean
  order: ORDERType[]
  onOpenChange: (open: boolean) => void
  onConfirm: (order: ORDERType[]) => void
}

const DROPPABLE_ID = 'resume-sidebar-mobile-sort'

export function MobileSortDialog({ open, order, onOpenChange, onConfirm }: MobileSortDialogProps) {
  const initialDraft = order.filter(id => id !== 'basics')
  const [draft, setDraft] = useState<ORDERType[]>(initialDraft)

  useEffect(() => {
    if (open)
      setDraft(order.filter(id => id !== 'basics'))
  }, [open, order])

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination || source.index === destination.index)
      return
    const next = [...draft]
    const [moved] = next.splice(source.index, 1)
    next.splice(destination.index, 0, moved)
    setDraft(next)
  }

  const handleConfirm = () => {
    onConfirm(['basics', ...draft])
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        className="z-[60] max-h-[80vh] overflow-hidden flex flex-col"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>调整模块顺序</AlertDialogTitle>
          <AlertDialogDescription>
            长按并拖动模块进行排序，确认后应用。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId={DROPPABLE_ID}>
              {droppable => (
                <ul
                  ref={droppable.innerRef}
                  {...droppable.droppableProps}
                  className="flex flex-col gap-1.5"
                >
                  {draft.map((id, index) => {
                    const item = ITEMS.find(it => it.id === id)
                    if (!item)
                      return null
                    return (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(draggable, snapshot) => {
                          const row = (
                            <li
                              ref={draggable.innerRef}
                              {...draggable.draggableProps}
                              {...draggable.dragHandleProps}
                              style={draggable.draggableProps.style}
                              className={`touch-none flex items-center gap-3 rounded-md border bg-background px-3 py-2 select-none cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'shadow-lg ring-2 ring-primary/40' : ''
                              }`}
                              aria-label={`拖动 ${item.label}`}
                            >
                              <span className="text-foreground/80">{item.icon}</span>
                              <span className="text-sm">{item.label}</span>
                            </li>
                          )
                          if (snapshot.isDragging && typeof document !== 'undefined')
                            return createPortal(row, document.body)
                          return row
                        }}
                      </Draggable>
                    )
                  })}
                  {droppable.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
