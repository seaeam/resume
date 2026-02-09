import type { HistoryEntry } from '../../types'
import { Pencil } from 'lucide-react'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ResponsiveDialog, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog'
import useHistoryStore from '../../store'

interface EditDialogProps {
  entry: HistoryEntry
  open: boolean
  onClose: () => void
}

export function EditDialog({ entry, open, onClose }: EditDialogProps) {
  const { updateEntryLabel } = useHistoryStore()
  const [label, setLabel] = useState(entry.label || '')

  const handleSave = useCallback(() => {
    updateEntryLabel(entry.id, label.trim())
    onClose()
  }, [label, entry.id, updateEntryLabel, onClose])

  return (
    <ResponsiveDialog open={open} onOpenChange={v => !v && onClose()}>
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="flex items-center gap-2">
          <Pencil className="h-4 w-4" />
          编辑版本标签
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          自定义此版本的显示名称
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-4 px-4 py-2">
        <div className="space-y-2">
          <Label>版本标签</Label>
          <Input
            placeholder="输入版本标签..."
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>
      </div>

      <ResponsiveDialogFooter className="px-4 pb-4">
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSave}>
          保存
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
