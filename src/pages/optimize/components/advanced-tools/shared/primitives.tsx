import type { ComponentType, PropsWithChildren, ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type ToolTone = 'default' | 'danger' | 'info' | 'primary' | 'success' | 'warning'

const TOOL_TONE_CLASS_MAP: Record<ToolTone, { badge: string, card: string, icon: string }> = {
  default: {
    card: 'border-border/60 bg-muted/20',
    icon: 'bg-background text-foreground',
    badge: 'border-border/60 bg-background text-foreground',
  },
  primary: {
    card: 'border-primary/20 bg-primary/5',
    icon: 'bg-primary/10 text-primary',
    badge: 'border-primary/20 bg-primary/10 text-primary',
  },
  success: {
    card: 'border-green-500/20 bg-green-500/5',
    icon: 'bg-green-500/10 text-green-700 dark:text-green-300',
    badge: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300',
  },
  warning: {
    card: 'border-amber-500/20 bg-amber-500/5',
    icon: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    badge: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  },
  danger: {
    card: 'border-red-500/20 bg-red-500/5',
    icon: 'bg-red-500/10 text-red-700 dark:text-red-300',
    badge: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
  },
  info: {
    card: 'border-sky-500/20 bg-sky-500/5',
    icon: 'bg-sky-500/10 text-sky-700 dark:text-sky-300',
    badge: 'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  },
}

export function ToolPanelCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={cn('min-w-0 border-border/60 bg-card/95 shadow-sm', className)}>
      {children}
    </Card>
  )
}

export function ToolPanelHeader({
  action,
  badge,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode
  badge?: ReactNode
  description?: string
  icon?: ComponentType<{ className?: string }>
  title: string
}) {
  return (
    <CardHeader className="border-b border-border/50 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex flex-1 gap-3">
          {Icon && (
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="break-words text-base font-semibold leading-tight">{title}</CardTitle>
              {badge}
            </div>
            {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>
    </CardHeader>
  )
}

export function ToolPanelBody({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <CardContent className={cn('min-w-0 p-4 md:p-5', className)}>{children}</CardContent>
}

export function ToolStatCard({
  badge,
  hint,
  icon: Icon,
  label,
  tone = 'default',
  value,
}: {
  badge?: ReactNode
  hint?: string
  icon?: ComponentType<{ className?: string }>
  label: string
  tone?: ToolTone
  value: string | number
}) {
  const toneClass = TOOL_TONE_CLASS_MAP[tone]

  return (
    <div className={cn('h-full w-full min-w-0 rounded-xl border p-4 shadow-sm', toneClass.card)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
          {badge}
        </div>
        {Icon && (
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', toneClass.icon)}>
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-3 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function ToolEmptyState({
  description,
  title,
}: {
  description: string
  title: string
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="size-5" />
      </div>
      <p className="mt-4 text-sm font-medium">{title}</p>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

export function ToolMetaBadge({
  children,
  tone = 'default',
}: PropsWithChildren<{ tone?: ToolTone }>) {
  const toneClass = TOOL_TONE_CLASS_MAP[tone]

  return (
    <Badge variant="outline" className={cn('rounded-full border', toneClass.badge)}>
      {children}
    </Badge>
  )
}
