import type { RestoreStrategy, ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { History, LoaderCircle } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useIsMobile } from '@/hooks/use-mobile'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import { listResumeHistoryVersions, restoreResumeHistoryVersion } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import RestoreVersionDialog from '@/pages/history/components/dialogs/restore-version-dialog'
import { normalizeHistoryVersion } from '@/pages/history/utils'
import useCurrentResumeStore from '@/store/resume/current'
import useResumeStore from '@/store/resume/form'
import { resolveHistoryDropdownOpenState } from './history-version-preview-state'
import HistoryVersionPreviewDialog from './version-compare'
import { VersionListItem } from './version-list-item'

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
        <VersionListItem
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
