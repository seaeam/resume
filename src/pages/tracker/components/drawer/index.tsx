import type { ApplicationStatus, JobApplication } from '../../types'
import type { DrawerTab } from './drawer-nav'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { DrawerDocument } from './drawer-document'
import { DrawerEditForm } from './drawer-edit-form'
import { DrawerHeader } from './drawer-header'
import { DrawerNav } from './drawer-nav'
import { DrawerProgress } from './drawer-progress'
import { DrawerStageDetail } from './drawer-stage-detail'

// Re-export AddJobDrawer
export { AddJobDrawer } from './drawer-add-job'

interface JobDrawerProps {
  job: JobApplication | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange?: (jobId: string, status: ApplicationStatus) => void
  onJobUpdate?: (job: JobApplication) => void
}

export function JobDrawer({
  job,
  open,
  onOpenChange,
  onJobUpdate,
}: JobDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('information')
  const [isEditing, setIsEditing] = useState(false)
  // 当前查看的阶段（可能是已完成的历史阶段，不等于 job.status）
  const [viewingStage, setViewingStage] = useState<ApplicationStatus | null>(null)

  // 重置状态当 Drawer 关闭时
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab('information')
      setIsEditing(false)
      setViewingStage(null)
    }
    onOpenChange(newOpen)
  }

  const handleSave = (updated: JobApplication) => {
    onJobUpdate?.(updated)
    setIsEditing(false)
  }

  // 当 job 更新后重置 viewingStage 到最新状态
  const handleJobUpdate = (updated: JobApplication) => {
    onJobUpdate?.(updated)
    setViewingStage(null) // 回到最新阶段
  }

  if (!job)
    return null

  // 实际显示的阶段：viewingStage 或 job.status
  const displayStage = viewingStage || job.status

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:w-1/2 sm:max-w-none overflow-y-auto rounded-l-2xl p-0">
        <SheetHeader>
          <SheetTitle className="sr-only">职位详情</SheetTitle>
          <SheetDescription className="sr-only">
            查看和编辑职位申请的详细信息
          </SheetDescription>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* 导航栏 */}
          <DrawerNav activeTab={activeTab} onTabChange={setActiveTab} />

          {/* 内容区域 */}
          {activeTab === 'information'
            ? (
                isEditing
                  ? (
                      <DrawerEditForm
                        job={job}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                      />
                    )
                  : (
                      <>
                        {/* 上模块：公司信息 */}
                        <DrawerHeader
                          job={job}
                          onEdit={() => setIsEditing(true)}
                        />
                        {/* 中模块：进度条 */}
                        <DrawerProgress
                          currentStatus={job.status}
                          stageDetails={job.stage_details}
                          viewingStage={viewingStage}
                          onStageClick={(stage) => {
                            setViewingStage(stage === job.status ? null : stage)
                          }}
                        />
                        {/* 下模块：阶段详情 */}
                        {job.status !== 'rejected' && (
                          <DrawerStageDetail
                            job={job}
                            displayStage={displayStage}
                            isViewingHistory={viewingStage !== null && viewingStage !== job.status}
                            onUpdate={handleJobUpdate}
                          />
                        )}
                      </>
                    )
              )
            : (
                <DrawerDocument
                  job={job}
                  onUpdate={onJobUpdate!}
                />
              )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
