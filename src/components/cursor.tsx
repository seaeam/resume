import type React from 'react'
import { MousePointer2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Cursor({
  className,
  style,
  color,
  name,
}: {
  className?: string
  style?: React.CSSProperties
  color: string
  name: string
}) {
  return (
    <div className={cn('pointer-events-none', className)} style={style}>
      <MousePointer2
        color={color}
        fill={color}
        size={30}
        className="transition-transform duration-100"
      />

      <div
        className="mt-1 rounded px-2 py-1 text-center text-xs font-bold text-white transition-all duration-100"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}
