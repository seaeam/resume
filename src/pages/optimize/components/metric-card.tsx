import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  colorClass: string
}

export function MetricCard({ title, value, subtext, icon: Icon, colorClass }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4 md:p-6 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={cn('text-3xl font-bold', colorClass)}>{value}</span>
            {subtext && <span className="text-xs text-muted-foreground truncate max-w-full">{subtext}</span>}
          </div>
        </div>
        <div className={cn('p-3 rounded-full bg-opacity-10 shrink-0 ml-2', colorClass.replace('text-', 'bg-').replace('600', '100'))}>
          <Icon className={cn('w-6 h-6', colorClass)} />
        </div>
      </CardContent>
    </Card>
  )
}
