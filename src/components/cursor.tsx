import type React from 'react'
import { useCallback, useLayoutEffect, useRef } from 'react'
import { MousePointer2 } from 'lucide-react'
import { usePerfectCursor } from '@/hooks/use-perfect-cursor'
import { cn } from '@/lib/utils'

export function Cursor({
  className,
  style,
  point,
  color,
  name,
}: {
  className?: string
  style?: React.CSSProperties
  point: { x: number, y: number }
  color: string
  name: string
}) {
  const cursorRef = useRef<HTMLDivElement | null>(null)

  const animateCursor = useCallback((nextPoint: number[]) => {
    const element = cursorRef.current
    if (!element)
      return

    element.style.setProperty('transform', `translate(${nextPoint[0]}px, ${nextPoint[1]}px)`)
  }, [])

  const moveCursor = usePerfectCursor(animateCursor)

  useLayoutEffect(() => {
    moveCursor([point.x, point.y])
  }, [moveCursor, point.x, point.y])

  return (
    <div ref={cursorRef} className={cn('pointer-events-none', className)} style={style}>
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
