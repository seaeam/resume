import type { ReactNode } from 'react'

interface SidebarSkeletonProps {
  header?: ReactNode
  main: ReactNode
  sidebar?: ReactNode
  sidebarPosition?: 'left' | 'right'
}

export default function SidebarSkeleton({
  header,
  main,
  sidebar,
  sidebarPosition = 'left',
}: SidebarSkeletonProps) {
  const content = (
    <>
      <aside className="flex flex-col gap-5">
        {sidebar}
      </aside>
      <main className="flex min-w-0 flex-col gap-6">
        {main}
      </main>
    </>
  )

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="grid gap-6 md:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        {sidebarPosition === 'right'
          ? (
              <>
                <main className="flex min-w-0 flex-col gap-6">
                  {main}
                </main>
                <aside className="flex flex-col gap-5">
                  {sidebar}
                </aside>
              </>
            )
          : content}
      </div>
    </div>
  )
}
