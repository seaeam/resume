import type { ReactNode } from 'react'

interface StackedSkeletonProps {
  header?: ReactNode
  main: ReactNode
  sidebar?: ReactNode
}

export default function StackedSkeleton({ header, main, sidebar }: StackedSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="flex flex-col gap-6">
        {main}
      </div>
      {sidebar
        ? (
            <div className="flex flex-col gap-5 border-t pt-5">
              {sidebar}
            </div>
          )
        : null}
    </div>
  )
}
