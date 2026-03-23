import type { ToolVisualDefinition } from './config'
import { ArrowUpRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ToolCardProps {
  disabled: boolean
  onClick: () => void
  tool: ToolVisualDefinition
}

export function ToolCard({ disabled, onClick, tool }: ToolCardProps) {
  const Icon = tool.icon

  return (
    <Button
      variant="outline"
      className={cn(
        'group h-auto min-h-[180px] items-stretch justify-start whitespace-normal rounded-2xl border-border/60 bg-card/95 p-0 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-card hover:shadow-md',
        disabled && 'cursor-not-allowed opacity-60',
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <div className="flex min-w-0 w-full flex-col gap-6 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={cn('flex size-11 items-center justify-center rounded-xl border border-white/10 shadow-sm', tool.iconClassName)}>
            <Icon className="size-5" />
          </div>
          <Badge className={cn('max-w-full rounded-full border px-2.5 py-0.5 text-[11px] font-medium', tool.badgeClassName)}>
            {tool.badge}
          </Badge>
        </div>

        <div className="min-w-0 space-y-3">
          <div className="flex min-w-0 items-start gap-2">
            <span className="min-w-0 wrap-break-word text-lg font-semibold tracking-tight text-foreground">{tool.title}</span>
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <p className="wrap-break-word text-sm leading-7 text-muted-foreground">{tool.description}</p>
        </div>
      </div>
    </Button>
  )
}
