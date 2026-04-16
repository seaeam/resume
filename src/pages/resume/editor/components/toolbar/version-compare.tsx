import type { ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import HistoryResumePreview from '@/pages/history/components/shared/history-resume-preview'
import { SOURCE_META } from '@/pages/history/const'
import { getVersionTitle } from '@/pages/history/utils'
import { formatDateTime } from '@/utils/date'
import {
  HISTORY_VERSION_PREVIEW_EXIT_DURATION,
  syncHistoryVersionPreviewState,
} from './history-version-preview-state'

function HistoryVersionPreviewDialog({
  previewTarget,
  onClose,
}: {
  previewTarget: ResumeHistoryVersionRecord | null
  onClose: () => void
}) {
  const isMobile = useIsMobile()
  const [renderTarget, setRenderTarget] = useState<ResumeHistoryVersionRecord | null>(previewTarget)
  const [mobileOpen, setMobileOpen] = useState(Boolean(previewTarget))
  const closeTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    const nextState = syncHistoryVersionPreviewState({
      currentRenderTarget: renderTarget,
      nextTarget: previewTarget,
    })

    setRenderTarget(nextState.renderTarget)
    setMobileOpen(nextState.mobileOpen)

    if (!nextState.shouldScheduleCleanup) {
      return
    }

    closeTimerRef.current = window.setTimeout(() => {
      setRenderTarget(null)
      closeTimerRef.current = null
    }, HISTORY_VERSION_PREVIEW_EXIT_DURATION)
  }, [previewTarget, renderTarget])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  if (!renderTarget) {
    return null
  }

  const sourceMeta = SOURCE_META[renderTarget.source_type]
  const SourceIcon = sourceMeta.icon
  const title = getVersionTitle(renderTarget)
  const description = `V${renderTarget.version_no} · ${formatDateTime(renderTarget.created_at)}`

  const handleMobileClose = () => {
    setMobileOpen(false)

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      setRenderTarget(null)
      closeTimerRef.current = null
      onClose()
    }, HISTORY_VERSION_PREVIEW_EXIT_DURATION)
  }

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleMobileClose()
          }
        }}
      >
        <DrawerContent className="flex h-[94dvh] max-h-[94dvh] flex-col overflow-hidden rounded-t-[28px] p-0">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <Separator />
          <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="space-y-4 px-4 py-4 pb-8">
              <div className="flex flex-wrap gap-2">
                <Badge className={sourceMeta.badgeClassName}>
                  <SourceIcon data-icon="inline-start" />
                  {sourceMeta.label}
                </Badge>
                {renderTarget.milestone_name?.trim() && (
                  <Badge variant="outline">{renderTarget.milestone_name.trim()}</Badge>
                )}
              </div>
              <HistoryResumePreview snapshot={renderTarget.snapshot} />
            </div>
          </div>
          <Separator />
          <DrawerFooter className="shrink-0 bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
            <DrawerClose asChild>
              <Button variant="outline" onClick={handleMobileClose}>关闭</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={Boolean(previewTarget)} onOpenChange={open => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(90vh,920px)] w-[calc(82vw)] min-w-0 max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-border/70 bg-background/95 p-0 shadow-xl backdrop-blur sm:max-w-[min(1480px,calc(100vw-2rem))]"
      >
        <DialogHeader className="shrink-0 px-5 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-2">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
              <div className="flex flex-wrap gap-2">
                <Badge className={sourceMeta.badgeClassName}>
                  <SourceIcon data-icon="inline-start" />
                  {sourceMeta.label}
                </Badge>
                {renderTarget.milestone_name?.trim() && (
                  <Badge variant="outline">{renderTarget.milestone_name.trim()}</Badge>
                )}
              </div>
            </div>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label="关闭预览">
                <X />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <Separator />
        <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-3 py-4 pb-8 sm:px-4 sm:py-5 sm:pb-6">
            <HistoryResumePreview snapshot={renderTarget.snapshot} />
          </div>
        </div>
        <Separator />
        <DialogFooter className="shrink-0 bg-muted/30 px-5 py-4 sm:px-6 lg:px-8">
          <DialogClose asChild>
            <Button variant="outline">关闭</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default HistoryVersionPreviewDialog
