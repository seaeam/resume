import type { DrawerTab } from '../../types'
import { FileText, Rows3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DrawerNavProps {
  activeTab: DrawerTab
  onTabChange: (tab: DrawerTab) => void
}

export default function DrawerNav({ activeTab, onTabChange }: DrawerNavProps) {
  return (
    <div className="flex gap-2 rounded-2xl border border-border/60 bg-muted/60 p-1">
      <button
        type="button"
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
          activeTab === 'information'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onTabChange('information')}
      >
        <Rows3 className="size-4" />
        跟进详情
      </button>
      <button
        type="button"
        className={cn(
          'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
          activeTab === 'document'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onTabChange('document')}
      >
        <FileText className="size-4" />
        投递简历
      </button>
    </div>
  )
}
