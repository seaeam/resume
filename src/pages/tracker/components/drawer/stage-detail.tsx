import type { ApplicationStatus, InterviewSubStage, StageStatus } from '../../types'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon, ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_ORDER, DEFAULT_INTERVIEW_SUB_STAGES, STAGE_STATUS_COLORS, STAGE_STATUS_OPTIONS } from '../../const'
import useTrackerStore from '../../store'

interface DrawerStageDetailProps {
  displayStage: ApplicationStatus
  isViewingHistory?: boolean
  onSaved?: () => void
}

export default function DrawerStageDetail({ displayStage, isViewingHistory = false, onSaved }: DrawerStageDetailProps) {
  const { selectedJob: job, updateJob } = useTrackerStore()

  // 本地状态
  const [localDetails, setLocalDetails] = useState(job?.stage_details || [])
  const [localSubStages, setLocalSubStages] = useState(() => job?.interview_sub_stages || [])
  const [isDirty, setIsDirty] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [openSubStages, setOpenSubStages] = useState<Set<string>>(() => new Set())

  // 当 job 变化时重置本地状态
  useEffect(() => {
    setLocalDetails(job?.stage_details || [])
    setLocalSubStages(job?.interview_sub_stages || [])
    setIsDirty(false)
  }, [job?.id, job?.status, job?.stage_details, job?.interview_sub_stages])

  if (!job)
    return null

  const isInterviewStatus = displayStage === 'interview'

  // 当前显示阶段的详情
  const currentStageDetail = localDetails.find(s => s.stage === displayStage)
  const currentStatus = currentStageDetail?.status || '待处理'
  const statusColors = STAGE_STATUS_COLORS[currentStatus]

  // 检查是否有修改
  const checkDirty = () => {
    const detailsChanged = JSON.stringify(job.stage_details) !== JSON.stringify(localDetails)
    const subStagesChanged = JSON.stringify(job.interview_sub_stages || []) !== JSON.stringify(localSubStages)
    return detailsChanged || subStagesChanged
  }

  const markDirty = () => setIsDirty(checkDirty())

  // 更新当前阶段的 stage_details
  const updateStageDetail = (updates: Partial<typeof currentStageDetail>) => {
    setLocalDetails((prev) => {
      const exists = prev.find(s => s.stage === displayStage)
      if (exists) {
        return prev.map(s => s.stage === displayStage ? { ...s, ...updates } : s)
      }
      return [...prev, { stage: displayStage, status: '待处理' as const, start_date: null, notes: '', ...updates }]
    })
    // 直接设置 dirty，因为 setLocalDetails 是异步的，checkDirty 读不到新值
    setIsDirty(true)
  }

  const handleStatusChange = (newStatus: StageStatus) => {
    if (newStatus === '已拒绝') {
      const rejectedDetails = localDetails.map(s => ({ ...s, status: '已拒绝' as const }))
      setLocalDetails(rejectedDetails)
      setIsStatusOpen(false)
      setIsDirty(true)
      return
    }

    // 选择已完成时的校验
    if (newStatus === '已完成') {
      if (isInterviewStatus) {
        // 面试阶段：所有面试轮次必须已保存为已完成
        const savedSubStages = job.interview_sub_stages || []
        const allCompleted = savedSubStages.length > 0
          && savedSubStages.every(s => s.status === '已完成')
        if (!allCompleted) {
          toast.warning('请先完成当前的面试')
          setIsStatusOpen(false)
          return
        }
      }
      else {
        // 非面试阶段：开始时间不能为空
        const detail = localDetails.find(s => s.stage === displayStage)
        if (!detail?.start_date) {
          toast.warning('请先选择开始时间，保存完成后，才能选择已完成状态')
          setIsStatusOpen(false)
          return
        }
      }
    }

    // 所有状态变更只更新本地状态，等待用户保存
    updateStageDetail({ status: newStatus })
    setIsStatusOpen(false)
  }

  const handleDateChange = (date: Date | undefined) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : null
    updateStageDetail({ start_date: dateStr })
  }

  // 面试子阶段操作
  const addSubStage = () => {
    const newSubStage: InterviewSubStage = {
      id: crypto.randomUUID(),
      label: `${DEFAULT_INTERVIEW_SUB_STAGES[localSubStages.length % DEFAULT_INTERVIEW_SUB_STAGES.length]}`,
      status: '待处理',
      start_date: null,
      notes: '',
      order: localSubStages.length,
    }
    setLocalSubStages([...localSubStages, newSubStage])
    setOpenSubStages(prev => new Set(prev).add(newSubStage.id))
    markDirty()
  }

  const deleteSubStage = (id: string) => {
    setLocalSubStages(prev => prev.filter(s => s.id !== id).map((s, idx) => ({ ...s, order: idx })))
    setOpenSubStages((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    markDirty()
  }

  const updateSubStage = (id: string, updates: Partial<InterviewSubStage>) => {
    // 子阶段拒绝状态传播
    if (updates.status === '已拒绝') {
      const rejectedDetails = localDetails.map(s => ({ ...s, status: '已拒绝' as const }))
      const rejectedSubStages = localSubStages.map(s => ({ ...s, status: '已拒绝' as const }))
      setLocalDetails(rejectedDetails)
      setLocalSubStages(rejectedSubStages)
      setIsDirty(true)
      return
    }

    setLocalSubStages(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    setIsDirty(true)
  }

  const toggleSubStage = (id: string) => {
    setOpenSubStages((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      }
      else {
        next.add(id)
      }
      return next
    })
  }

  const handleSave = () => {
    if (!job)
      return

    // 检查当前阶段是否标记为“已完成”，如果是则自动推进到下一阶段
    const currentDetail = localDetails.find(s => s.stage === displayStage)
    if (currentDetail?.status === '已完成' && displayStage === job.status) {
      const currentIdx = APPLICATION_STATUS_ORDER.indexOf(job.status)
      const nextStatus = APPLICATION_STATUS_ORDER[currentIdx + 1]

      if (nextStatus) {
      // 确保下一阶段的 detail 存在
        const hasNext = localDetails.find(s => s.stage === nextStatus)
        const finalDetails = hasNext
          ? localDetails
          : [...localDetails, { stage: nextStatus, status: '待处理' as const, start_date: null, notes: '' }]

        updateJob({
          ...job,
          status: nextStatus,
          stage_details: finalDetails,
          interview_sub_stages: localSubStages,
        })
        setIsDirty(false)
        setOpenSubStages(new Set())
        onSaved?.()
        return
      }
    }

    // 普通保存（未完成 / 拒绝 等）
    updateJob({
      ...job,
      stage_details: localDetails,
      interview_sub_stages: localSubStages,
    })
    setIsDirty(false)
    setOpenSubStages(new Set())
    onSaved?.()
  }

  const handleCancel = () => {
    setLocalDetails(job.stage_details)
    setLocalSubStages(job.interview_sub_stages || [])
    setIsDirty(false)
  }

  const selectedDate = currentStageDetail?.start_date
    ? parseISO(currentStageDetail.start_date)
    : undefined

  return (
    <div className="py-4 space-y-4">
      {/* 标题 + 状态 Badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{displayStage}</h3>
        {!isViewingHistory
          ? (
              <Popover open={isStatusOpen} onOpenChange={setIsStatusOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all',
                      'border cursor-pointer hover:opacity-80',
                      statusColors.bg,
                      statusColors.text,
                      statusColors.border,
                    )}
                  >
                    {currentStatus}
                    <ChevronDown className="size-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-32 p-1" align="end">
                  <div className="flex flex-col">
                    {STAGE_STATUS_OPTIONS.map((status) => {
                      const colors = STAGE_STATUS_COLORS[status]
                      const isSelected = status === currentStatus
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusChange(status)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                            'hover:bg-muted cursor-pointer',
                            isSelected && 'bg-muted',
                          )}
                        >
                          <span className={cn('inline-flex items-center gap-2', colors.text)}>
                            <span className={cn('size-2 rounded-full', colors.bg, 'border', colors.border)} />
                            {status}
                          </span>
                          {isSelected && <span className="text-primary">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )
          : (
              <Badge className={cn(statusColors.bg, statusColors.text, statusColors.border, 'border')}>
                {currentStatus}
              </Badge>
            )}
      </div>

      {/* 开始时间 - 仅进行中/已完成时显示，面试状态不显示 */}
      {!isInterviewStatus && currentStatus !== '待处理' && (
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">开始时间</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !selectedDate && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {selectedDate
                  ? format(selectedDate, 'yyyy年M月d日', { locale: zhCN })
                  : '选择日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                locale={zhCN}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* 面试子阶段（仅面试中状态显示） */}
      {isInterviewStatus && currentStatus !== '待处理' && (
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground block">面试轮次</label>
          <div className="space-y-2">
            {localSubStages.map((subStage) => {
              const subColors = STAGE_STATUS_COLORS[subStage.status]
              const isOpen = openSubStages.has(subStage.id)
              const subDate = subStage.start_date ? parseISO(subStage.start_date) : undefined

              return (
                <Collapsible
                  key={subStage.id}
                  open={isOpen}
                  onOpenChange={() => toggleSubStage(subStage.id)}
                >
                  <div className="border rounded-lg p-3 space-y-3">
                    {/* 标题行 */}
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <button type="button" className="hover:opacity-70">
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                      </CollapsibleTrigger>
                      <Input
                        value={subStage.label}
                        onChange={e => updateSubStage(subStage.id, { label: e.target.value })}
                        className="h-7 flex-1 text-sm font-medium"
                        placeholder="轮次名称"
                      />
                      <Badge variant="outline" className={cn(subColors.bg, subColors.text, 'text-xs')}>
                        {subStage.status}
                      </Badge>
                      <button
                        type="button"
                        onClick={() => deleteSubStage(subStage.id)}
                        className="text-destructive hover:opacity-70"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <CollapsibleContent className="space-y-3">
                      {/* 子阶段状态选择器 */}
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
                                    onClick={() => updateSubStage(subStage.id, { status })}
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

                      {/* 子阶段开始时间 - 仅进行中/已完成显示 */}
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
                                {subDate ? format(subDate, 'yyyy年M月d日', { locale: zhCN }) : '选择日期'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={subDate}
                                onSelect={date =>
                                  updateSubStage(subStage.id, {
                                    start_date: date ? format(date, 'yyyy-MM-dd') : null,
                                  })}
                                locale={zhCN}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}

                      {/* 面经笔记 - 仅进行中/已完成显示 */}
                      {subStage.status !== '待处理' && (
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">面经笔记</label>
                          <SimpleEditor
                            content={subStage.notes || ''}
                            onChange={editor => updateSubStage(subStage.id, { notes: editor.getHTML() })}
                          />
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              )
            })}
          </div>

          {/* 添加面试轮次按钮 */}
          <Button
            type="button"
            variant="outline"
            onClick={addSubStage}
            disabled={
              currentStatus !== '进行中'
              || (localSubStages.length > 0
                && localSubStages[localSubStages.length - 1]?.status !== '已完成')
            }
            className="w-full"
          >
            <Plus className="size-4 mr-2" />
            添加面试轮次
          </Button>
        </div>
      )}

      {/* 保存/取消按钮 */}
      {isDirty && (
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleCancel}>
            取消
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            保存
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        选择「已完成」自动推进到下一阶段
      </p>
    </div>
  )
}
