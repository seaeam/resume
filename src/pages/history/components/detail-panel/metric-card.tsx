import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  icon?: LucideIcon
  toneClassName?: string
}

export default function MetricCard({ label, value, icon: Icon, toneClassName }: MetricCardProps) {
  return (
    <Card className={cn('rounded-xl bg-muted/10 py-0 shadow-none', toneClassName)}>
      <CardContent className="px-4 py-4">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {Icon && <Icon data-icon="inline-start" />}
          <span>{label}</span>
        </div>
        <div className="mt-2 text-sm font-medium">{value}</div>
      </CardContent>
    </Card>
  )
}
