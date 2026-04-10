import type { ReactNode } from 'react'
import { useRuntimeStyles } from '../renderers/utils'

interface SingleColumnSkeletonProps {
  header?: ReactNode
  main: ReactNode
}

export default function SingleColumnSkeleton({ header, main }: SingleColumnSkeletonProps) {
  const { spacing } = useRuntimeStyles()

  return (
    <div className="flex flex-col" style={{ lineHeight: spacing.lineHeight }}>
      {header}
      <div className="flex flex-col" style={{ gap: spacing.sectionMargin }}>
        {main}
      </div>
    </div>
  )
}
