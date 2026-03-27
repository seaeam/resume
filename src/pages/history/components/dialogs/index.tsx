import type { RestoreStrategy } from '../../types'
import { LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import useHistoryStore from '../../store'

interface HistoryDialogsProps {
  restoreTargetId: number | null
  deleteTargetId: number | null
  onCloseRestore: () => void
  onConfirmRestore: (strategy: RestoreStrategy) => Promise<void>
  onCloseDelete: () => void
  onConfirmDelete: () => Promise<void>
}

export default function HistoryDialogs({
  restoreTargetId,
  deleteTargetId,
  onCloseRestore,
  onConfirmRestore,
  onCloseDelete,
  onConfirmDelete,
}: HistoryDialogsProps) {
  const { versions, restoring, deletingVersionId } = useHistoryStore()
  const [restoreStrategy, setRestoreStrategy] = useState<RestoreStrategy | null>(null)
  const restoreTarget = versions.find(version => version.id === restoreTargetId)
  const deleteTarget = versions.find(version => version.id === deleteTargetId)

  useEffect(() => {
    if (!restoring) {
      setRestoreStrategy(null)
    }
  }, [restoring])

  const handleRestore = async (strategy: RestoreStrategy) => {
    setRestoreStrategy(strategy)
    await onConfirmRestore(strategy)
  }

  return (
    <>
      <AlertDialog
        open={Boolean(restoreTarget)}
        onOpenChange={(open) => {
          if (!open && !restoring) {
            onCloseRestore()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-accent text-accent-foreground">
              <RotateCcw />
            </AlertDialogMedia>
            <AlertDialogTitle>恢复此版本？</AlertDialogTitle>
            <AlertDialogDescription>
              恢复后，当前内容会被此版本覆盖，并生成一条新的恢复记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 px-6 pb-1 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="font-medium text-foreground">恢复并保留当前内容</div>
              <p className="mt-1 leading-6">
                先额外保存一条“恢复前备份”，再恢复到所选版本。适合希望保留当前内容的情况。
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
              <div className="font-medium text-foreground">直接恢复</div>
              <p className="mt-1 leading-6">
                不额外保存当前内容，直接恢复到所选版本，并生成一条新的恢复记录。
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>取消</AlertDialogCancel>
            <Button
              variant="outline"
              disabled={restoring}
              onClick={() => handleRestore('without_backup')}
            >
              {restoring && restoreStrategy === 'without_backup' && (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              )}
              {restoring && restoreStrategy === 'without_backup' ? '恢复中...' : '直接恢复'}
            </Button>
            <Button disabled={restoring} onClick={() => handleRestore('with_backup')}>
              {restoring && restoreStrategy === 'with_backup' && (
                <LoaderCircle data-icon="inline-start" className="animate-spin" />
              )}
              {restoring && restoreStrategy === 'with_backup' ? '恢复中...' : '恢复并保留当前内容'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open && !deletingVersionId) {
            onCloseDelete()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>删除此版本？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，V
              {deleteTarget?.version_no}
              的说明、标签和内容将无法恢复，但当前正在编辑的内容不会受影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deletingVersionId)}>取消</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={Boolean(deletingVersionId)}
              onClick={onConfirmDelete}
            >
              {deletingVersionId && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              {deletingVersionId ? '删除中...' : '确认删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
