import type { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  subtext?: string
  icon: LucideIcon
  colorClass: string
  loading?: boolean
}

export default function MetricCard({ title, value, subtext, icon: Icon, colorClass, loading = false }: MetricCardProps) {
  return (
    <Card className="h-full group relative">
      <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
        <Icon className={cn('w-20 h-20', colorClass)} />
      </div>
      <CardContent className="p-4 md:p-5 flex flex-col justify-between h-full relative z-10">
        <div className="flex items-start justify-between w-full mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('p-1.5 rounded-md', colorClass, `bg-${colorClass.replace('text-', '')}`)}>
              <Icon className={cn('w-4 h-4', colorClass)} />
            </div>
            <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{title}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline gap-1">
            <span className={cn('text-3xl md:text-4xl font-bold tracking-tight', colorClass)}>
              {loading ? <Spinner /> : value}
            </span>
          </div>

          {subtext && (
            <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 min-h-[2.5em]" title={subtext}>
              {subtext}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
