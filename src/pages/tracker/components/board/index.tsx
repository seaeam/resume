import type { DropResult } from '@hello-pangea/dnd'
import type { ApplicationStatus } from '../../types'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { BOARD_COLUMNS } from '../../const'
import useTrackerStore from '../../store'
import { ColumnCard } from './column-card'

const EDGE_THRESHOLD = 120
const SCROLL_SPEED = 80

export default function BoardView() {
  const { jobs, changeJobStatus, filterStatus } = useTrackerStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const isDraggingRef = useRef(false)

  // 拖拽时在库内置自动滚动基础上叠加加速
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current)
        return
      const container = scrollContainerRef.current
      if (!container)
        return

      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX

      if (mouseX < rect.left + EDGE_THRESHOLD) {
        const intensity = (rect.left + EDGE_THRESHOLD - mouseX) / EDGE_THRESHOLD
        container.scrollLeft -= SCROLL_SPEED * Math.max(intensity, 0.15)
      }
      else if (mouseX > rect.right - EDGE_THRESHOLD) {
        const intensity = (mouseX - (rect.right - EDGE_THRESHOLD)) / EDGE_THRESHOLD
        container.scrollLeft += SCROLL_SPEED * Math.max(intensity, 0.15)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const getJobsByStatus = (status: ApplicationStatus) =>
    jobs.filter(job => job.status === status)

  const scrollToColumnCenter = useCallback((status: string) => {
    const container = scrollContainerRef.current
    const columnEl = columnRefs.current.get(status)
    if (!container || !columnEl)
      return

    const containerWidth = container.clientWidth
    const columnLeft = columnEl.offsetLeft - container.offsetLeft
    const columnWidth = columnEl.offsetWidth
    const targetScroll = columnLeft - (containerWidth - columnWidth) / 2

    container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' })
  }, [])

  // filterStatus 变化时滚动到对应列并居中
  useEffect(() => {
    if (filterStatus && BOARD_COLUMNS.some(c => c.status === filterStatus)) {
      requestAnimationFrame(() => {
        scrollToColumnCenter(filterStatus)
      })
    }
  }, [filterStatus, scrollToColumnCenter])

  // 拖拽结束后滚动到目标列（靠近可见即可）
  const scrollToColumn = useCallback((status: string) => {
    const container = scrollContainerRef.current
    const columnEl = columnRefs.current.get(status)
    if (!container || !columnEl)
      return

    const containerRect = container.getBoundingClientRect()
    const columnRect = columnEl.getBoundingClientRect()

    if (columnRect.left < containerRect.left || columnRect.right > containerRect.right) {
      const scrollLeft = columnEl.offsetLeft - container.offsetLeft - 16
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' })
    }
  }, [])

  const handleDragStart = () => {
    isDraggingRef.current = true
  }

  const handleDragEnd = (result: DropResult) => {
    isDraggingRef.current = false

    const { destination, draggableId } = result
    if (!destination)
      return

    const newStatus = destination.droppableId as ApplicationStatus
    changeJobStatus(draggableId, newStatus)

    requestAnimationFrame(() => {
      scrollToColumn(newStatus)
    })
  }

  const isColumnHighlighted = (status: ApplicationStatus) =>
    filterStatus !== null && filterStatus === status

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={scrollContainerRef}
        className="w-full min-w-0 max-w-full overflow-x-auto"
      >
        <div className="flex w-max gap-4 px-4 pb-4 min-h-[500px]">
          {BOARD_COLUMNS.map((column) => {
            const columnJobs = getJobsByStatus(column.status)
            const highlighted = isColumnHighlighted(column.status)
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
                      className={cn(
                        'flex-1 flex flex-col gap-2 p-2 rounded-lg transition-all duration-300',
                        snapshot.isDraggingOver
                          ? 'bg-primary/10 ring-2 ring-primary/20'
                          : highlighted
                            ? 'ring-2 ring-primary/40 bg-primary/5'
                            : 'bg-muted/30',
                      )}
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
