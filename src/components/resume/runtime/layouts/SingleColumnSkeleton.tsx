import type { ReactNode } from 'react'

interface SingleColumnSkeletonProps {
  header?: ReactNode
  main: ReactNode
}

export default function SingleColumnSkeleton({ header, main }: SingleColumnSkeletonProps) {
  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="flex flex-col gap-6">
        {main}
      </div>
    </div>
  )
}
