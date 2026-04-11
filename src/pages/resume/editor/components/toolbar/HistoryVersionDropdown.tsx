import type { RestoreStrategy, ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { History, LoaderCircle, RotateCcw, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import { listResumeHistoryVersions, restoreResumeHistoryVersion } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import RestoreVersionDialog from '@/pages/history/components/dialogs/restore-version-dialog'
import HistoryResumePreview from '@/pages/history/components/shared/history-resume-preview'
import { SOURCE_META } from '@/pages/history/const'
import { getVersionTitle, normalizeHistoryVersion } from '@/pages/history/utils'
import useCurrentResumeStore from '@/store/resume/current'
import useResumeStore from '@/store/resume/form'
import { formatDateTime, formatRelativeTime } from '@/utils/date'
import {
  HISTORY_VERSION_PREVIEW_EXIT_DURATION,
  resolveHistoryDropdownOpenState,
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

function VersionSummaryCard({ version, mobile, onRestore, onPreview }: {
  version: ResumeHistoryVersionRecord
  mobile: boolean
  onRestore: (versionId: number) => void
  onPreview: (versionId: number) => void
}) {
  const sourceMeta = SOURCE_META[version.source_type]
  const SourceIcon = sourceMeta.icon

  return (
    <article
      className={cn(
        'rounded-2xl border border-border/70 bg-background/95 p-3',
        'transition-colors hover:border-border hover:bg-muted/20',
        mobile ? 'space-y-3' : 'flex items-start gap-3',
      )}
    >
      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            V
            {version.version_no}
          </Badge>
          <Badge className={sourceMeta.badgeClassName}>
            <SourceIcon data-icon="inline-start" />
            {sourceMeta.label}
          </Badge>
          {version.milestone_name?.trim() && (
            <Badge variant="outline" className="border-primary/20 text-primary">
              {version.milestone_name.trim()}
            </Badge>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="truncate text-sm font-semibold text-foreground">
            {getVersionTitle(version)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(version.created_at)}
            {' '}
            ·
            {' '}
            {formatDateTime(version.created_at)}
          </div>
        </div>

        <p className="line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">
          {version.description?.trim() || '暂无版本说明'}
        </p>
      </div>

      <div className={cn('shrink-0 gap-2', mobile ? 'grid grid-cols-2' : 'flex w-36 flex-col')}>
        <Button size="sm" onClick={() => onRestore(version.id)}>
          <RotateCcw data-icon="inline-start" />
          回滚
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPreview(version.id)}>
          预览
        </Button>
      </div>
    </article>
  )
}

export function ResumeHistoryVersionDropdown() {
  const isMobile = useIsMobile()
  const resumeId = useCurrentResumeStore(state => state.resumeId)
  const isInitialized = useResumeStore(state => state.isInitialized)
  const getHistoryRestoreSource = useResumeStore(state => state.getHistoryRestoreSource)
  const preserveDropdownOpenRef = useRef(false)

  const [desktopOpen, setDesktopOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResumeHistoryVersionRecord[]>([])
  const [restoreTargetId, setRestoreTargetId] = useState<number | null>(null)
  const [previewTargetId, setPreviewTargetId] = useState<number | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreStrategy, setRestoreStrategy] = useState<RestoreStrategy | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const canUseHistory = Boolean(resumeId) && !isOfflineResumeId(resumeId!) && isInitialized

  const restoreTarget = useMemo(
    () => versions.find(version => version.id === restoreTargetId) ?? null,
    [restoreTargetId, versions],
  )
  const previewTarget = useMemo(
    () => versions.find(version => version.id === previewTargetId) ?? null,
    [previewTargetId, versions],
  )

  useEffect(() => {
    if (!resumeId || isOfflineResumeId(resumeId)) {
      setVersions([])
      setError(null)
      setLoading(false)
      setPreviewTargetId(null)
    }
  }, [resumeId])

  useEffect(() => {
    if (!desktopOpen || !resumeId || isOfflineResumeId(resumeId)) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    listResumeHistoryVersions(resumeId)
      .then((result) => {
        if (cancelled) {
          return
        }

        setVersions(result.map(normalizeHistoryVersion))
      })
      .catch((nextError) => {
        if (cancelled) {
          return
        }

        setError(nextError instanceof Error ? nextError.message : '历史版本加载失败')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [desktopOpen, reloadKey, resumeId])

  const handleRestoreRequest = (versionId: number) => {
    setRestoreTargetId(versionId)
  }

  const handlePreviewRequest = (versionId: number) => {
    preserveDropdownOpenRef.current = true
    setPreviewTargetId(versionId)
  }

  const handleDropdownOpenChange = (nextOpen: boolean) => {
    const preserveOpen = preserveDropdownOpenRef.current || previewTargetId !== null
    preserveDropdownOpenRef.current = false

    setDesktopOpen(currentOpen => resolveHistoryDropdownOpenState({
      currentOpen,
      nextOpen,
      preserveOpen,
    }))
  }

  const handleConfirmRestore = async (strategy: RestoreStrategy) => {
    if (!resumeId || !restoreTarget) {
      return
    }

    setRestoring(true)
    setRestoreStrategy(strategy)

    try {
      const { snapshot, updatedAt } = getHistoryRestoreSource()

      await restoreResumeHistoryVersion({
        resumeId,
        targetVersion: restoreTarget,
        currentSnapshot: snapshot,
        currentUpdatedAt: updatedAt,
        strategy,
      })

      setRestoreTargetId(null)
      setReloadKey(current => current + 1)
      toast.success('已恢复至所选版本')
    }
    catch (nextError) {
      toast.error(nextError instanceof Error ? nextError.message : '恢复版本失败')
    }
    finally {
      setRestoring(false)
      setRestoreStrategy(null)
    }
  }

  const trigger = (
    <Button
      variant="outline"
      size={isMobile ? 'icon' : 'sm'}
      className={cn(isMobile && 'size-9')}
      disabled={!canUseHistory}
      title={!resumeId
        ? '当前未选择简历'
        : resumeId && isOfflineResumeId(resumeId)
          ? '离线简历暂不支持历史版本'
          : undefined}
    >
      <History data-icon="inline-start" />
      {!isMobile && <span>历史版本</span>}
    </Button>
  )

  const listContent = (
    <div className="space-y-3 p-3">
      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 px-4 py-8 text-sm text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin" />
          正在加载历史版本...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loading && !error && versions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
          暂无历史版本
        </div>
      )}

      {!loading && !error && versions.map(version => (
        <VersionSummaryCard
          key={version.id}
          version={version}
          mobile={isMobile}
          onRestore={handleRestoreRequest}
          onPreview={handlePreviewRequest}
        />
      ))}
    </div>
  )

  return (
    <>
      <DropdownMenu modal={false} open={desktopOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          side="bottom"
          className="overflow-hidden rounded-2xl border-border/70 p-0"
        >
          <DropdownMenuLabel className="px-4 py-3 text-sm font-semibold">
            历史版本
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="mx-0 my-0" />
          <div className="max-h-[min(32rem,calc(100vh-10rem))] overflow-y-auto">
            {listContent}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <RestoreVersionDialog
        targetVersion={restoreTarget}
        restoring={restoring}
        restoreStrategy={restoreStrategy}
        onOpenChange={() => setRestoreTargetId(null)}
        onConfirm={handleConfirmRestore}
      />
      <HistoryVersionPreviewDialog
        previewTarget={previewTarget}
        onClose={() => setPreviewTargetId(null)}
      />
    </>
  )
}
