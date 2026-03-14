import type { PropsWithChildren, ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function ToolPanelCard({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={cn('border-border/60 bg-card/95 shadow-sm', className)}>
      {children}
    </Card>
  )
}

export function ToolPanelHeader({
  action,
  description,
  title,
}: {
  action?: ReactNode
  description?: string
  title: string
}) {
  return (
    <CardHeader className="border-b border-border/50 pb-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle className="break-words text-base font-semibold leading-tight">{title}</CardTitle>
          {description && <p className="text-sm leading-6 text-muted-foreground">{description}</p>}
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
  return <CardContent className={cn('space-y-4 p-4 md:p-5', className)}>{children}</CardContent>
}

export function ToolStatCard({
  hint,
  label,
  value,
}: {
  hint?: string
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-medium tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
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
