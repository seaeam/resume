import type { HistoryEntry } from '../../types'
import dayjs from 'dayjs'
import { Flag, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  ResponsiveDialog,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useHistoryStore from '../../store'

/** 快捷里程碑模板 */
const MILESTONE_TEMPLATES = [
  { label: '投字节-前端', icon: '🚀' },
  { label: '投腾讯-前端', icon: '🐧' },
  { label: '投阿里-前端', icon: '🧡' },
  { label: '投美团-前端', icon: '🟡' },
  { label: '最终版本', icon: '🏆' },
  { label: '初稿完成', icon: '📝' },
]

interface MilestoneDialogProps {
  entry: HistoryEntry
  open: boolean
  onClose: () => void
}

export function MilestoneDialog({ entry, open, onClose }: MilestoneDialogProps) {
  const { setMilestone, removeMilestone } = useHistoryStore()
  const [label, setLabel] = useState(entry.milestoneLabel || '')

  const handleSave = useCallback(() => {
    if (!label.trim())
      return
    const dateStr = dayjs().format('MMM YYYY')
    const finalLabel = label.includes('(') || label.includes('（') ? label : `${label}（${dateStr}）`
    setMilestone(entry.id, finalLabel)
    onClose()
  }, [label, entry.id, setMilestone, onClose])

  const handleRemove = useCallback(() => {
    removeMilestone(entry.id)
    onClose()
  }, [entry.id, removeMilestone, onClose])

  const handleSelectTemplate = useCallback((template: typeof MILESTONE_TEMPLATES[0]) => {
    const dateStr = dayjs().format('MMM YYYY')
    setLabel(`${template.label}（${dateStr}）`)
  }, [])

  return (
    <ResponsiveDialog open={open} onOpenChange={v => !v && onClose()}>
      <ResponsiveDialogHeader className="px-6 pt-6">
        <ResponsiveDialogTitle className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-amber-500" />
          {entry.isMilestone ? '编辑里程碑' : '创建里程碑版本'}
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription>
          为此版本添加里程碑标签，方便快速定位重要节点
        </ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <div className="space-y-4 px-6 py-4">
        <div className="space-y-2">
          <Label>里程碑名称</Label>
          <Input
            placeholder="例如：投字节-前端（Jan 2026）"
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* 快捷模板 */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            快捷模板
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {MILESTONE_TEMPLATES.map(t => (
              <Button
                key={t.label}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSelectTemplate(t)}
              >
                {t.icon}
                {' '}
                {t.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <ResponsiveDialogFooter className="gap-2 sm:gap-0 px-6 pb-6">
        {entry.isMilestone && (
          <Button variant="destructive" size="sm" onClick={handleRemove}>
            移除里程碑
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button onClick={handleSave} disabled={!label.trim()}>
          {entry.isMilestone ? '保存' : '创建'}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
