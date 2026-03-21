import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

interface DetailDiscardDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function DetailDiscardDialog({ open, onCancel, onConfirm }: DetailDiscardDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={nextOpen => !nextOpen && onCancel()}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>放弃未保存的修改？</AlertDialogTitle>
          <AlertDialogDescription>
            你正在编辑当前版本的信息。如果现在切换版本或关闭详情面板，未保存的修改将会丢失。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>继续编辑</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>放弃修改</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
