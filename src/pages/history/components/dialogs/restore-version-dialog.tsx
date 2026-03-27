import type { RestoreStrategy, ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { LoaderCircle, RotateCcw } from 'lucide-react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle } from '@/components/ui/alert-dialog'

import { Button } from '@/components/ui/button'

interface RestoreVersionDialogProps {
  targetVersion: ResumeHistoryVersionRecord | null
  restoring: boolean
  restoreStrategy: RestoreStrategy | null
  onOpenChange: (open: boolean) => void
  onConfirm: (strategy: RestoreStrategy) => Promise<void>
}

export default function RestoreVersionDialog({
  targetVersion,
  restoring,
  restoreStrategy,
  onOpenChange,
  onConfirm,
}: RestoreVersionDialogProps) {
  return (
    <AlertDialog
      open={Boolean(targetVersion)}
      onOpenChange={(open) => {
        if (!open && !restoring) {
          onOpenChange(open)
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
            onClick={() => onConfirm('without_backup')}
          >
            {restoring && restoreStrategy === 'without_backup' && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {restoring && restoreStrategy === 'without_backup' ? '恢复中...' : '直接恢复'}
          </Button>
          <Button disabled={restoring} onClick={() => onConfirm('with_backup')}>
            {restoring && restoreStrategy === 'with_backup' && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {restoring && restoreStrategy === 'with_backup' ? '恢复中...' : '恢复并保留当前内容'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
