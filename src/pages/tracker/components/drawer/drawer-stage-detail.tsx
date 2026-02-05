import type { JobApplication, StageDetail, StageStatus } from '../../types'
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { STAGE_STATUS_OPTIONS } from '../../const'

interface DrawerStageDetailProps {
  job: JobApplication
  onUpdate?: (job: JobApplication) => void
}

// 状态颜色配置
const STATUS_COLORS: Record<StageStatus, { bg: string, text: string, border: string }> = {
  待处理: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  进行中: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  已完成: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  已拒绝: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
}

export function DrawerStageDetail({ job, onUpdate }: DrawerStageDetailProps) {
  // 本地状态用于跟踪修改
  const [localDetails, setLocalDetails] = useState<StageDetail[]>(job.stage_details)
  const [isDirty, setIsDirty] = useState(false)
  const [isStatusOpen, setIsStatusOpen] = useState(false)

  // 当 job 变化时重置本地状态
  useEffect(() => {
    setLocalDetails(job.stage_details)
    setIsDirty(false)
  }, [job.id, job.status])

  // 从 stage_details 数组中找到当前状态的详情
  const currentStageDetail = localDetails.find(s => s.stage === job.status)
  const currentStatus = currentStageDetail?.status || '待处理'
  const statusColors = STATUS_COLORS[currentStatus]

  // 检查是否有修改
  const checkDirty = (newDetails: StageDetail[]) => {
    const original = job.stage_details.find(s => s.stage === job.status)
    const current = newDetails.find(s => s.stage === job.status)
    if (!original && !current)
      return false
    if (!original || !current)
      return true
    return (
      original.status !== current.status
      || original.start_date !== current.start_date
      || original.notes !== current.notes
    )
  }

  const updateLocalDetails = (updater: (prev: StageDetail[]) => StageDetail[]) => {
    setLocalDetails((prev) => {
      const newDetails = updater(prev)
      setIsDirty(checkDirty(newDetails))
      return newDetails
    })
  }

  const handleStatusChange = (newStatus: StageStatus) => {
    // 显示 toast 提示
    if (newStatus === '已完成') {
      toast.success('成功🎉')
    }
    else if (newStatus === '已拒绝') {
      toast.error('拒绝😡')
    }

    updateLocalDetails((prev) => {
      const existingDetail = prev.find(s => s.stage === job.status)
      if (existingDetail) {
        return prev.map(s => s.stage === job.status ? { ...s, status: newStatus } : s)
      }
      return [...prev, { stage: job.status, status: newStatus, start_date: null, notes: '' }]
    })
    setIsStatusOpen(false)
  }

  const handleNotesChange = (notes: string) => {
    updateLocalDetails((prev) => {
      const existingDetail = prev.find(s => s.stage === job.status)
      if (existingDetail) {
        return prev.map(s => s.stage === job.status ? { ...s, notes } : s)
      }
      return [...prev, { stage: job.status, status: '待处理' as const, start_date: null, notes }]
    })
  }

  const handleDateChange = (date: Date | undefined) => {
    const dateStr = date ? format(date, 'yyyy-MM-dd') : null
    updateLocalDetails((prev) => {
      const existingDetail = prev.find(s => s.stage === job.status)
      if (existingDetail) {
        return prev.map(s => s.stage === job.status ? { ...s, start_date: dateStr } : s)
      }
      return [...prev, { stage: job.status, status: '待处理' as const, start_date: dateStr, notes: '' }]
    })
  }

  const handleSave = () => {
    onUpdate?.({ ...job, stage_details: localDetails })
    setIsDirty(false)
  }

  const handleCancel = () => {
    setLocalDetails(job.stage_details)
    setIsDirty(false)
  }

  // 解析日期字符串为 Date 对象
  const selectedDate = currentStageDetail?.start_date
    ? parseISO(currentStageDetail.start_date)
    : undefined

  return (
    <div className="py-4 space-y-4">
      {/* 标题 + 状态 Badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{job.status}</h3>
        {/* 自定义状态选择器 */}
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
                const colors = STATUS_COLORS[status]
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
      </div>

      {/* 开始时间 - 使用 shadcn DatePicker */}
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

      {/* 面经笔记 采用tiptap富文本编辑器 */}
      <div>
        <label className="text-sm text-muted-foreground mb-1 block">面经笔记</label>
        <SimpleEditor
          content={currentStageDetail?.notes || ''}
          onChange={editor => handleNotesChange(editor.getHTML())}
        />
      </div>

      {/* 保存/取消按钮 - 仅在有修改时显示 */}
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
        点击进度条上的圆点可以切换到其他阶段
      </p>
    </div>
  )
}
