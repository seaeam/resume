import type { ReactNode } from 'react'
import { useRuntimeStyles } from '../renderers/utils'

interface StackedSkeletonProps {
  header?: ReactNode
  main: ReactNode
  sidebar?: ReactNode
}

export default function StackedSkeleton({ header, main, sidebar }: StackedSkeletonProps) {
  const { spacing } = useRuntimeStyles()

  return (
    <div className="flex flex-col" style={{ lineHeight: spacing.lineHeight }}>
      {header}
      <div className="flex flex-col" style={{ gap: spacing.sectionMargin }}>
        {main}
      </div>
      {sidebar
        ? (
            <div
              className="flex flex-col border-t"
              style={{
                gap: spacing.sectionMargin,
                paddingTop: spacing.sectionMargin,
              }}
            >
              {sidebar}
            </div>
          )
        : null}
    </div>
  )
}
