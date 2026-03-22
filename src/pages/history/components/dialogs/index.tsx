import { LoaderCircle, RotateCcw, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import useHistoryStore from '../../store'

interface HistoryDialogsProps {
  restoreTargetId: number | null
  deleteTargetId: number | null
  onCloseRestore: () => void
  onConfirmRestore: () => Promise<void>
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
  const restoreTarget = versions.find(version => version.id === restoreTargetId)
  const deleteTarget = versions.find(version => version.id === deleteTargetId)

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
              恢复后，当前内容将被此版本覆盖。系统会先自动保存当前内容，然后再生成一条“恢复自 V
              {restoreTarget?.version_no}
              ”记录，方便后续撤回。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>取消</AlertDialogCancel>
            <Button disabled={restoring} onClick={() => void onConfirmRestore()}>
              {restoring && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
              {restoring ? '恢复中...' : '确认恢复'}
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
              onClick={() => void onConfirmDelete()}
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
