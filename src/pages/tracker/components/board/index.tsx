import type { DropResult } from '@hello-pangea/dnd'
import type { ApplicationStatus } from '../../types'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useCallback, useRef } from 'react'
import { BOARD_COLUMNS } from '../../const'
import useTrackerStore from '../../store'
import { ColumnCard } from './column-card'

export default function BoardView() {
  const { jobs, changeJobStatus } = useTrackerStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const getJobsByStatus = (status: ApplicationStatus) =>
    jobs.filter(job => job.status === status)

  // 滚动到目标列
  const scrollToColumn = useCallback((status: string) => {
    const container = scrollContainerRef.current
    const columnEl = columnRefs.current.get(status)
    if (!container || !columnEl)
      return

    const containerRect = container.getBoundingClientRect()
    const columnRect = columnEl.getBoundingClientRect()

    // 如果目标列不在可视区域内，滚动到该列
    if (columnRect.left < containerRect.left || columnRect.right > containerRect.right) {
      const scrollLeft = columnEl.offsetLeft - container.offsetLeft - 16
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [])

  const handleDragEnd = (result: DropResult) => {
    const { destination, draggableId } = result
    if (!destination)
      return

    const newStatus = destination.droppableId as ApplicationStatus
    changeJobStatus(draggableId, newStatus)

    // 拖拽完成后滚动到目标列
    requestAnimationFrame(() => {
      scrollToColumn(newStatus)
    })
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div ref={scrollContainerRef} className="w-full min-w-0 max-w-full overflow-x-auto scroll-smooth">
        <div className="flex w-max gap-4 pb-4 min-h-[500px]">
          {BOARD_COLUMNS.map((column) => {
            const columnJobs = getJobsByStatus(column.status)
            return (
              <div
                key={column.status}
                ref={(el) => {
                  if (el)
                    columnRefs.current.set(column.status, el)
                }}
                className="flex flex-col min-w-[280px] w-[280px] shrink-0"
              >
                {/* 列标题 */}
                <div className="flex items-center justify-between px-2 py-2">
                  <h3 className="font-semibold">{column.label}</h3>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {columnJobs.length}
                  </span>
                </div>

                {/* Droppable 区域 */}
                <Droppable droppableId={column.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 flex flex-col gap-2 p-2 rounded-lg overflow-y-auto transition-colors ${
                        snapshot.isDraggingOver ? 'bg-primary/10 ring-2 ring-primary/20' : 'bg-muted/30'
                      }`}
                    >
                      {columnJobs.length > 0
                        ? (
                            columnJobs.map((job, index) => (
                              <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={snapshot.isDragging ? 'opacity-80 rotate-2 scale-105' : ''}
                                  >
                                    <ColumnCard job={job} />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )
                        : (
                            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm min-h-[120px]">
                              暂无职位
                            </div>
                          )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </div>
    </DragDropContext>
  )
}
