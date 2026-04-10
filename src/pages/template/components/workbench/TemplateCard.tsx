import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TemplateCardAction {
  label: string
  onClick: () => void
  variant?: 'default' | 'outline' | 'secondary'
  className?: string
}

interface TemplateCardProps {
  preview: ReactNode
  tags?: ReactNode
  hoverActions?: TemplateCardAction[]
  title?: string
  description?: string
  meta?: ReactNode
  footerActions?: TemplateCardAction[]
  trailing?: ReactNode
  contentClassName?: string
}

function ActionButton({ action, large = false }: { action: TemplateCardAction, large?: boolean }) {
  return (
    <Button
      variant={action.variant ?? 'default'}
      size={large ? 'default' : 'sm'}
      className={cn(action.className)}
      onClick={action.onClick}
    >
      {action.label}
    </Button>
  )
}

export function TemplateCard({
  preview,
  tags,
  hoverActions,
  title,
  description,
  meta,
  footerActions,
  trailing,
  contentClassName,
}: TemplateCardProps) {
  return (
    <div className="group flex h-full flex-col">
      <div className="relative">
        {preview}
        {hoverActions?.length
          ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
                <div className="pointer-events-auto flex flex-col items-center gap-3">
                  {hoverActions.map(action => (
                    <ActionButton key={action.label} action={action} large />
                  ))}
                </div>
              </div>
            )
          : null}
      </div>

      <div className={cn('space-y-3 pt-3', contentClassName)}>
        {title || trailing
          ? (
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  {title ? <h3 className="text-lg font-semibold tracking-tight">{title}</h3> : null}
                  {description ? <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p> : null}
                </div>
                {trailing}
              </div>
            )
          : null}

        {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}

        {footerActions?.length
          ? (
              <div className="flex flex-wrap gap-3">
                {footerActions.map(action => (
                  <ActionButton key={action.label} action={action} />
                ))}
              </div>
            )
          : null}

        {tags ? <div className="flex flex-wrap items-center gap-2">{tags}</div> : null}
      </div>
    </div>
  )
}
