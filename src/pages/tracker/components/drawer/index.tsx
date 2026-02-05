import type { ApplicationStatus, JobApplication } from '../../types'
import type { DrawerTab } from './drawer-nav'
import { useState } from 'react'
import {
  Sheet,
  SheetContent,
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
  onStatusChange,
  onJobUpdate,
}: JobDrawerProps) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('information')
  const [isEditing, setIsEditing] = useState(false)

  // 重置状态当 Drawer 关闭时
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab('information')
      setIsEditing(false)
    }
    onOpenChange(newOpen)
  }

  const handleSave = (updated: JobApplication) => {
    onJobUpdate?.(updated)
    setIsEditing(false)
  }

  if (!job)
    return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto rounded-l-2xl p-0">
        <SheetHeader>
          <SheetTitle className="sr-only">职位详情</SheetTitle>
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
                          onStatusChange={status => onStatusChange?.(job.id, status)}
                        />
                        {/* 下模块：阶段详情 */}
                        <DrawerStageDetail
                          job={job}
                          onUpdate={onJobUpdate}
                        />
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
