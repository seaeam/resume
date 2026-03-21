import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

interface RotatingSlotProps {
  activeKey: string
  children: ReactNode
  className?: string
  contentClassName?: string
}

export function RotatingSlot({
  activeKey,
  children,
  className,
  contentClassName,
}: RotatingSlotProps) {
  return (
    <div className={cn('relative', className)}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className={cn('absolute inset-0 flex flex-col', contentClassName)}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
