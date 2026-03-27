import type { DropResult } from '@hello-pangea/dnd'
import type { ApplicationStatus } from '../../types'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, BOARD_COLUMNS, TRACKER_BOARD_COLUMN_HINTS } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, getTrackerErrorMessage } from '../../utils'
import { ColumnCard } from './column-card'

const EDGE_THRESHOLD = 120
const SCROLL_SPEED = 80

export default function BoardView() {
  const { jobs, filterStatus, syncJob, restoreJobsSnapshot } = useTrackerStore()
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
    const previousState = useTrackerStore.getState()
    const currentJob = previousState.jobs.find(job => job.id === draggableId)

    if (!currentJob)
      return

    const updatedStageDetails = autoCompleteStages(currentJob.status, newStatus, currentJob.stage_details, true)
    const optimisticJob = { ...currentJob, status: newStatus, stage_details: updatedStageDetails }

    syncJob(optimisticJob)

    updateCompany(draggableId, optimisticJob)
      .then((savedJob) => {
        syncJob(savedJob)

        if (newStatus === 'offer') {
          toast.success('Offer🎉')
        }
        else if (newStatus === 'rejected') {
          toast.error('终止流程')
        }
      })
      .catch((error) => {
        restoreJobsSnapshot({
          jobs: previousState.jobs,
          selectedJob: previousState.selectedJob,
        })
        toast.error('更新状态失败', { description: getTrackerErrorMessage(error) })
      })

    requestAnimationFrame(() => {
      scrollToColumn(newStatus)
    })
  }

  const isColumnHighlighted = (status: ApplicationStatus) =>
    filterStatus !== null && filterStatus === status

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
          <p className="text-sm font-medium text-foreground">看板视图</p>
          <p className="text-xs text-muted-foreground">
            适合横向观察整体流程。可以直接拖拽改状态，也可以在卡片上完成下一步推进。
          </p>
        </div>

        <div
          ref={scrollContainerRef}
          className="w-full min-w-0 max-w-full overflow-x-auto"
        >
          <div className="flex w-max gap-4 px-1 pb-4 min-h-[500px]">
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
                  className="flex w-[320px] min-w-[320px] shrink-0 flex-col"
                >
                  <div className={cn(
                    'mb-3 rounded-2xl border border-border/60 bg-card/80 px-4 py-3 shadow-sm',
                    highlighted && 'border-primary/60 bg-primary/5',
                  )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{column.label}</h3>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {TRACKER_BOARD_COLUMN_HINTS[column.status]}
                        </p>
                      </div>
                      <span className={cn(
                        'inline-flex min-w-8 items-center justify-center rounded-full px-2 py-1 text-xs font-medium',
                        highlighted
                          ? 'bg-primary text-primary-foreground'
                          : APPLICATION_STATUS_CONFIG[column.status].bgColor,
                        !highlighted && APPLICATION_STATUS_CONFIG[column.status].color,
                      )}
                      >
                        {columnJobs.length}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={column.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'flex-1 flex flex-col gap-3 rounded-2xl border border-border/60 p-3 transition-all duration-300',
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
                              <div className="flex min-h-[180px] flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/80 px-4 text-center text-sm text-muted-foreground">
                                拖入新的职位到这一列，或在列表里先推进到这个阶段
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
      </div>
    </DragDropContext>
  )
}
