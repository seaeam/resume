import type { DrawerTab } from '../../types'
import { cn } from '@/lib/utils'

interface DrawerNavProps {
  activeTab: DrawerTab
  onTabChange: (tab: DrawerTab) => void
}

export default function DrawerNav({ activeTab, onTabChange }: DrawerNavProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-lg">
      <button
        type="button"
        className={cn(
          'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
          activeTab === 'information'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onTabChange('information')}
      >
        基本信息
      </button>
      <button
        type="button"
        className={cn(
          'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
          activeTab === 'document'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground',
        )}
        onClick={() => onTabChange('document')}
      >
        简历文档
      </button>
    </div>
  )
}
