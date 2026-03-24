import type { ApplicationStatus, DrawerTab } from '../../types'
import { BriefcaseBusiness, ExternalLink, MapPin, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { updateCompany } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { autoCompleteStages, getTrackerErrorMessage } from '../../utils'
import DrawerDocument from './document'
import DrawerEditForm from './edit-form'
import DrawerHeaderInfo from './header'
import DrawerNav from './nav'
import DrawerProgress from './progress'
import DrawerStageDetail from './stage-detail'

export default function JobDrawer() {
  const { selectedJob, drawerOpen, closeJobDrawer, syncJob, restoreJobsSnapshot } = useTrackerStore()
  const isMobile = useIsMobile()
  const stageDetailRef = useRef<HTMLDivElement>(null)
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

  const focusCurrentStage = () => {
    setViewingStage(null)
    requestAnimationFrame(() => {
      stageDetailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const handleProgressChange = (newStatus: ApplicationStatus) => {
    if (!selectedJob)
      return

    const previousState = useTrackerStore.getState()
    const updatedStageDetails = autoCompleteStages(selectedJob.status, newStatus, selectedJob.stage_details)
    const optimisticJob = {
      ...selectedJob,
      status: newStatus,
      stage_details: updatedStageDetails,
    }

    syncJob(optimisticJob)

    void updateCompany(selectedJob.id, optimisticJob)
      .then((savedJob) => {
        syncJob(savedJob)
      })
      .catch((error) => {
        restoreJobsSnapshot({
          jobs: previousState.jobs,
          selectedJob: previousState.selectedJob,
        })
        toast.error('更新失败', { description: getTrackerErrorMessage(error) })
      })

    setViewingStage(null)
  }

  if (!selectedJob)
    return null

  const statusConfig = APPLICATION_STATUS_CONFIG[selectedJob.status]
  const displayStage = viewingStage || selectedJob.status
  const description = [
    selectedJob.location,
    selectedJob.salary,
    activeTab === 'document' ? '确认当前绑定简历' : '管理当前流程与阶段记录',
  ].filter(Boolean).join(' · ')

  const dialogHeaderContent = (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {selectedJob.company_logo
            ? <img src={selectedJob.company_logo} alt={selectedJob.company} className="size-7 object-contain" />
            : <BriefcaseBusiness className="size-5" />}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{selectedJob.company}</span>
          </div>
          <div className="space-y-1">
            <DialogTitle className="line-clamp-1 text-xl tracking-tight">{selectedJob.position}</DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" />
                {description}
              </span>
            </DialogDescription>
          </div>
        </div>
      </div>

      <Button variant="ghost" size="icon-sm" aria-label="关闭详情" onClick={() => handleOpenChange(false)}>
        <X />
      </Button>
    </div>
  )

  const footerHint = activeTab === 'document'
    ? '这里展示当前职位绑定的简历预览，方便确认投递版本。'
    : isEditing
      ? '编辑完成后会直接同步到当前职位记录。'
      : '高频动作优先在上方流程区完成，深入补充信息再进入当前阶段详情。'

  const footerActions = (
    <>
      <p className="text-xs leading-5 text-muted-foreground">{footerHint}</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {activeTab === 'information' && selectedJob.job_url && (
          <Button variant="outline" asChild>
            <a href={selectedJob.job_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              打开 JD
            </a>
          </Button>
        )}
        <Button variant="outline" onClick={() => handleOpenChange(false)}>
          关闭
        </Button>
      </div>
    </>
  )

  const drawerBody = (
    <div className="scrollbar-gutter-stable scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="px-4 py-4 pb-6 sm:px-6 sm:py-5 sm:pb-6 lg:px-8 lg:py-6">
        <DrawerNav activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'information'
          ? (
              isEditing
                ? (
                    <div className="mt-5">
                      <DrawerEditForm
                        onSaved={handleSaved}
                        onCancel={() => setIsEditing(false)}
                      />
                    </div>
                  )
                : (
                    <div className="mt-5 space-y-5">
                      <DrawerHeaderInfo onEdit={() => setIsEditing(true)} />
                      <DrawerProgress
                        viewingStage={viewingStage}
                        onStageClick={(stage) => {
                          setViewingStage(stage === selectedJob.status ? null : stage)
                        }}
                        onStatusChange={handleProgressChange}
                        onFocusCurrentStage={focusCurrentStage}
                      />
                      {selectedJob.status !== 'rejected' && (
                        <div ref={stageDetailRef}>
                          <DrawerStageDetail
                            displayStage={displayStage}
                            isViewingHistory={viewingStage !== null && viewingStage !== selectedJob.status}
                            onSaved={() => setViewingStage(null)}
                          />
                        </div>
                      )}
                    </div>
                  )
            )
          : (
              <div className="mt-5">
                <DrawerDocument />
              </div>
            )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={drawerOpen} onOpenChange={handleOpenChange}>
        <DrawerContent className="flex h-[94dvh] max-h-[94dvh] flex-col overflow-hidden rounded-t-[28px] p-0">
          <DrawerHeader className="shrink-0 px-4 py-4 text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn('rounded-full border-0 px-2.5 py-1 text-xs font-medium', statusConfig.bgColor, statusConfig.color)}>
                    {statusConfig.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{selectedJob.company}</span>
                </div>
                <DrawerTitle className="line-clamp-2 text-xl">{selectedJob.position}</DrawerTitle>
                <DrawerDescription>{description}</DrawerDescription>
              </div>

              <Button variant="ghost" size="icon-sm" aria-label="关闭详情" onClick={() => handleOpenChange(false)}>
                <X />
              </Button>
            </div>
          </DrawerHeader>
          <Separator />
          {drawerBody}
          <Separator />
          <DrawerFooter className="shrink-0 flex flex-col gap-3 bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
            {footerActions}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={drawerOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(90vh,920px)] w-[calc(84vw)] min-w-0 max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-border/70 bg-background/95 p-0 shadow-xl backdrop-blur sm:max-w-[min(1180px,calc(100vw-2rem))] lg:max-w-[min(1320px,84vw)]"
      >
        <DialogHeader className="shrink-0 px-5 py-4 sm:px-6 sm:py-5 lg:px-8">
          {dialogHeaderContent}
        </DialogHeader>
        <Separator />
        {drawerBody}
        <Separator />
        <DialogFooter className="shrink-0 flex-col gap-3 bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {footerActions}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
