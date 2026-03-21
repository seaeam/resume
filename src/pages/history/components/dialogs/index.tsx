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
            <AlertDialogTitle>恢复到这个版本？</AlertDialogTitle>
            <AlertDialogDescription>
              恢复后，当前简历内容会被这个历史版本覆盖。系统会先自动保存一条“恢复前快照”，随后再新增一条“恢复自 V
              {restoreTarget?.version_no}
              ”记录，方便你随时撤回。
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
            <AlertDialogTitle>删除这个历史版本？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后，V
              {deleteTarget?.version_no}
              {' '}
              及其备注、标签和快照将无法恢复。当前简历内容不会被删除。
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
