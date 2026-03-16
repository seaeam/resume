import { useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import BoardView from './components/board/index'
import JobDrawer from './components/drawer'
import AddJobDrawer from './components/drawer/add-job'
import TrackerHeader from './components/header'
import ListView from './components/list'
import { StatusFilter } from './components/status-filter'
import useTrackerStore from './store'

function Tracker() {
  const { viewMode, loading, init } = useTrackerStore()

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
        <TrackerHeader />

        <StatusFilter />

        {/* 主内容区 */}
        <main className="w-full overflow-hidden">
          {loading
            ? (
                <div className="flex flex-col gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              )
            : viewMode === 'list'
              ? <ListView />
              : <BoardView />}
        </main>
      </div>

      <JobDrawer />
      <AddJobDrawer />
    </>
  )
}

export default Tracker
