import type { ApplicationStatus, DrawerTab } from '../../types'
import { useState } from 'react'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import useTrackerStore from '../../store'
import { autoCompleteStages } from '../../utils'
import DrawerDocument from './document'
import DrawerEditForm from './edit-form'
import DrawerHeaderInfo from './header'
import DrawerNav from './nav'
import DrawerProgress from './progress'
import DrawerStageDetail from './stage-detail'

export default function JobDrawer() {
  const { selectedJob, drawerOpen, closeJobDrawer, updateJob } = useTrackerStore()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<DrawerTab>('information')
  const [isEditing, setIsEditing] = useState(false)
  const [viewingStage, setViewingStage] = useState<ApplicationStatus | null>(null)

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab('information')
      setIsEditing(false)
      setViewingStage(null)
      closeJobDrawer()
    }
  }

  const handleSaved = () => {
    setIsEditing(false)
  }

  // 进度前进/后退
  const handleProgressChange = (newStatus: ApplicationStatus) => {
    if (!selectedJob)
      return
    const updatedStageDetails = autoCompleteStages(selectedJob.status, newStatus, selectedJob.stage_details)
    updateJob({
      ...selectedJob,
      status: newStatus,
      stage_details: updatedStageDetails,
    })
    setViewingStage(null)
  }

  if (!selectedJob)
    return null

  const displayStage = viewingStage || selectedJob.status

  const drawerContent = (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <DrawerNav activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'information'
        ? (
            isEditing
              ? (
                  <DrawerEditForm
                    onSaved={handleSaved}
                    onCancel={() => setIsEditing(false)}
                  />
                )
              : (
                  <>
                    <DrawerHeaderInfo
                      onEdit={() => setIsEditing(true)}
                    />
                    <DrawerProgress
                      viewingStage={viewingStage}
                      onStageClick={(stage) => {
                        setViewingStage(stage === selectedJob.status ? null : stage)
                      }}
                      onStatusChange={handleProgressChange}
                    />
                    {selectedJob.status !== 'rejected' && (
                      <DrawerStageDetail
                        displayStage={displayStage}
                        isViewingHistory={viewingStage !== null && viewingStage !== selectedJob.status}
                        onSaved={() => setViewingStage(null)}
                      />
                    )}
                  </>
                )
          )
        : (
            <DrawerDocument />
          )}
    </div>
  )

  // 移动端：底部 Drawer (vaul)
  if (isMobile) {
    return (
      <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>
              {selectedJob.company}
              {' '}
              ·
              {' '}
              {selectedJob.position}
            </DrawerTitle>
            <DrawerDescription>
              {selectedJob.location}
              {selectedJob.salary ? ` · ${selectedJob.salary}` : ''}
            </DrawerDescription>
          </DrawerHeader>
          {drawerContent}
        </DrawerContent>
      </Drawer>
    )
  }

  // 桌面端：右侧 Sheet
  return (
    <Sheet open={drawerOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[520px] lg:w-[600px] sm:max-w-none overflow-hidden rounded-l-2xl p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle>
            {selectedJob.company}
            {' '}
            ·
            {' '}
            {selectedJob.position}
          </SheetTitle>
          <SheetDescription>
            {selectedJob.location}
            {selectedJob.salary ? ` · ${selectedJob.salary}` : ''}
          </SheetDescription>
        </SheetHeader>
        {drawerContent}
      </SheetContent>
    </Sheet>
  )
}
