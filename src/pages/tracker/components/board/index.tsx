import type { DropResult } from '@hello-pangea/dnd'
import type { ApplicationStatus } from '../../types'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG, BOARD_COLUMNS } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, filterJobs, getTrackerErrorMessage } from '../../utils'
import { ColumnCard } from './column-card'

const EDGE_THRESHOLD = 120
const SCROLL_SPEED = 80

export default function BoardView() {
  const { jobs, filterStatus, searchKeyword, syncJob, restoreJobsSnapshot } = useTrackerStore()
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

  // 搜索结果在每一列内独立过滤（不按 filterStatus 隐藏列，保留所有列以便拖拽改状态）
  const filteredJobs = filterJobs(jobs, null, searchKeyword)
  const getJobsByStatus = (status: ApplicationStatus) =>
    filteredJobs.filter(job => job.status === status)

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

  // filterStatus 变化时滚动到对应列（仅当横向滚动时才生效）
  useEffect(() => {
    if (filterStatus && BOARD_COLUMNS.some(c => c.status === filterStatus)) {
      requestAnimationFrame(() => {
        scrollToColumn(filterStatus)
      })
    }
  }, [filterStatus, scrollToColumn])

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

    if (!currentJob || currentJob.status === newStatus)
      return

    const updatedStageDetails = autoCompleteStages(currentJob.status, newStatus, currentJob.stage_details, true)
    const optimisticJob = { ...currentJob, status: newStatus, stage_details: updatedStageDetails }

    syncJob(optimisticJob)

    updateCompany(draggableId, optimisticJob)
      .then((savedJob) => {
        syncJob(savedJob)
        if (newStatus === 'offer')
          toast.success('Offer🎉')
        else if (newStatus === 'rejected')
          toast.error('终止流程')
      })
      .catch((error) => {
        restoreJobsSnapshot({
          jobs: previousState.jobs,
          selectedJob: previousState.selectedJob,
        })
        toast.error('更新状态失败', { description: getTrackerErrorMessage(error) })
      })
  }

  const isColumnHighlighted = (status: ApplicationStatus) =>
    filterStatus !== null && filterStatus === status

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        ref={scrollContainerRef}
        className="w-full min-w-0 overflow-x-auto"
      >
        <div className="flex gap-3 pb-2 xl:gap-4 [&>*]:w-[280px] [&>*]:shrink-0 xl:[&>*]:w-auto xl:[&>*]:flex-1 xl:[&>*]:basis-0">
          {BOARD_COLUMNS.map((column) => {
            const columnJobs = getJobsByStatus(column.status)
            const highlighted = isColumnHighlighted(column.status)
            const config = APPLICATION_STATUS_CONFIG[column.status]
            return (
              <div
                key={column.status}
                ref={(el) => {
                  if (el)
                    columnRefs.current.set(column.status, el)
                }}
                className="flex min-w-0 flex-col"
              >
                <div className={cn(
                  'flex items-center justify-between gap-2 rounded-t-lg border border-b-0 bg-muted/40 px-3 py-2',
                  highlighted && 'border-primary/50 bg-primary/10',
                )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('size-2 shrink-0 rounded-full', config.bgColor)} />
                    <h3 className="truncate text-sm font-semibold">{column.label}</h3>
                  </div>
                  <span className={cn(
                    'inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium',
                    highlighted ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground',
                  )}
                  >
                    {columnJobs.length}
                  </span>
                </div>

                <Droppable droppableId={column.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'flex min-h-[400px] flex-1 flex-col gap-2 rounded-b-lg border bg-muted/20 p-2 transition-colors',
                        snapshot.isDraggingOver && 'bg-primary/5 ring-1 ring-primary/30',
                        highlighted && !snapshot.isDraggingOver && 'border-primary/50 bg-primary/5',
                      )}
                    >
                      {columnJobs.length > 0
                        ? (
                            columnJobs.map((job, index) => (
                              <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className={dragSnapshot.isDragging ? 'opacity-90 shadow-lg' : ''}
                                  >
                                    <ColumnCard job={job} />
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )
                        : (
                            <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                              拖拽职位至此
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
