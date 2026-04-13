import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AutoScrollContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  enabled?: boolean
  dependency?: any // 触发滚动的依赖项
}

const BOTTOM_THRESHOLD = 30

export function AutoScrollContainer({
  children,
  className,
  enabled = true,
  dependency,
  ...props
}: AutoScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollTop, scrollHeight, clientHeight } = el
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight <= BOTTOM_THRESHOLD
  }, [])

  useEffect(() => {
    if (enabled && isAtBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [dependency, enabled])

  // 当 enabled 变为 true 时（新一轮流式输出开始），重置为跟随底部
  useEffect(() => {
    if (enabled) {
      isAtBottomRef.current = true
    }
  }, [enabled])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      onScroll={handleScroll}
      {...props}
    >
      {children}
    </div>
  )
}
