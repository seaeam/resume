import type { RestoreStrategy, ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { History, LoaderCircle, RotateCcw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import { listResumeHistoryVersions, restoreResumeHistoryVersion } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { SOURCE_META } from '@/pages/history/const'
import RestoreVersionDialog from '@/pages/history/components/dialogs/restore-version-dialog'
import { getVersionTitle, normalizeHistoryVersion } from '@/pages/history/utils'
import useCurrentResumeStore from '@/store/resume/current'
import useResumeStore from '@/store/resume/form'
import { formatDateTime, formatRelativeTime } from '@/utils/date'
import { useIsMobile } from '@/hooks/use-mobile'

function VersionSummaryCard({
  version,
  mobile,
  onRestore,
}: {
  version: ResumeHistoryVersionRecord
  mobile: boolean
  onRestore: (versionId: number) => void
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
          回滚到当前版本
        </Button>
        <Button size="sm" variant="outline" disabled title="查看预览即将支持">
          查看预览
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

  const [desktopOpen, setDesktopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResumeHistoryVersionRecord[]>([])
  const [restoreTargetId, setRestoreTargetId] = useState<number | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreStrategy, setRestoreStrategy] = useState<RestoreStrategy | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const canUseHistory = Boolean(resumeId) && !isOfflineResumeId(resumeId!) && isInitialized
  const panelOpen = isMobile ? mobileOpen : desktopOpen

  const restoreTarget = useMemo(
    () => versions.find(version => version.id === restoreTargetId) ?? null,
    [restoreTargetId, versions],
  )

  useEffect(() => {
    if (!resumeId || isOfflineResumeId(resumeId)) {
      setVersions([])
      setError(null)
      setLoading(false)
    }
  }, [resumeId])

  useEffect(() => {
    if (!panelOpen || !resumeId || isOfflineResumeId(resumeId)) {
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
  }, [panelOpen, reloadKey, resumeId])

  const handleRestoreRequest = (versionId: number) => {
    setDesktopOpen(false)
    setMobileOpen(false)
    setRestoreTargetId(versionId)
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
        />
      ))}
    </div>
  )

  return (
    <>
      {isMobile
        ? (
            <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
              <DrawerTrigger asChild>{trigger}</DrawerTrigger>
              <DrawerContent className="flex h-[88dvh] max-h-[88dvh] flex-col overflow-hidden rounded-t-[28px] p-0">
                <DrawerHeader className="shrink-0 text-left">
                  <DrawerTitle>历史版本</DrawerTitle>
                  <DrawerDescription>按从新到旧查看版本摘要，并恢复到当前编辑内容。</DrawerDescription>
                </DrawerHeader>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  {listContent}
                </div>
                <DrawerFooter className="shrink-0 border-t bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
                  <DrawerClose asChild>
                    <Button variant="outline">关闭</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )
        : (
            <DropdownMenu open={desktopOpen} onOpenChange={setDesktopOpen}>
              <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                side="bottom"
                className="w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border-border/70 p-0"
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
          )}

      <RestoreVersionDialog
        targetVersion={restoreTarget}
        restoring={restoring}
        restoreStrategy={restoreStrategy}
        onOpenChange={() => setRestoreTargetId(null)}
        onConfirm={handleConfirmRestore}
      />
    </>
  )
}
