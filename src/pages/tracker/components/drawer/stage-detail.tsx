import type { ApplicationStatus } from '../../types'
import { Button } from '@/components/ui/button'
import { STAGE_STATUS_COLORS } from '../../const'
import { InterviewSubStages } from './interview-sub-stages'
import { StageDetailDatePicker } from './stage-detail-date-picker'
import { StageDetailHeader } from './stage-detail-header'
import { useStageDetail } from './use-stage-detail'

interface DrawerStageDetailProps {
  displayStage: ApplicationStatus
  isViewingHistory?: boolean
  onSaved?: () => void
}

export default function DrawerStageDetail({
  displayStage,
  isViewingHistory = false,
  onSaved,
}: DrawerStageDetailProps) {
  const {
    job,
    localSubStages,
    isDirty,
    isStatusOpen,
    setIsStatusOpen,
    openSubStages,
    saving,
    isInterviewStatus,
    currentStatus,
    selectedDate,
    handleStatusChange,
    handleDateChange,
    addSubStage,
    deleteSubStage,
    updateSubStage,
    toggleSubStage,
    handleSave: handleSaveHook,
    handleCancel,
  } = useStageDetail({ displayStage })

  if (!job) {
    return null
  }

  const statusColors = STAGE_STATUS_COLORS[currentStatus]

  const handleSave = async () => {
    await handleSaveHook()
    onSaved?.()
  }

  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <StageDetailHeader
        displayStage={displayStage}
        currentStatus={currentStatus}
        statusColors={statusColors}
        isViewingHistory={isViewingHistory}
        isStatusOpen={isStatusOpen}
        onStatusOpenChange={setIsStatusOpen}
        onStatusChange={handleStatusChange}
      />

      {/* Start date - only show for non-interview stages when not '待处理' */}
      {!isInterviewStatus && currentStatus !== '待处理' && (
        <StageDetailDatePicker
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
      )}

      {/* Interview sub-stages - only show for interview stages when not '待处理' */}
      {isInterviewStatus && currentStatus !== '待处理' && (
        <InterviewSubStages
          subStages={localSubStages}
          openSubStages={openSubStages}
          currentStatus={currentStatus}
          saving={saving}
          onAddSubStage={addSubStage}
          onDeleteSubStage={deleteSubStage}
          onUpdateSubStage={updateSubStage}
          onToggleSubStage={toggleSubStage}
        />
      )}

      <div className="min-h-14 pt-2">
        {isDirty && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCancel} disabled={saving}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              保存
            </Button>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        选择「已完成」自动推进到下一阶段
      </p>
    </div>
  )
}
