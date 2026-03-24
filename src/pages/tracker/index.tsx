import { useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { getCompanies } from '@/lib/supabase/resume'
import BoardView from './components/board/index'
import JobDrawer from './components/drawer'
import AddJobDrawer from './components/drawer/add-job'
import TrackerHeader from './components/header'
import ListView from './components/list'
import { StatusFilter } from './components/status-filter'
import useTrackerStore from './store'
import { getTrackerLoadErrorMeta } from './utils'

const TRACKER_SKELETON_KEYS = ['tracker-skeleton-1', 'tracker-skeleton-2', 'tracker-skeleton-3'] as const

function Tracker() {
  const { viewMode, loading } = useTrackerStore()

  useEffect(() => {
    const currentState = useTrackerStore.getState()
    if (currentState.isInitialized || currentState.loading)
      return

    let cancelled = false

    const loadJobs = async () => {
      useTrackerStore.setState({ loading: true, error: null })

      try {
        const jobs = await getCompanies()
        if (cancelled)
          return
        useTrackerStore.setState({ jobs, loading: false, error: null, isInitialized: true })
      }
      catch (error) {
        if (cancelled)
          return
        const { message, description } = getTrackerLoadErrorMeta(error)
        useTrackerStore.setState({ loading: false, error: message })
        toast.error(message, { description })
      }
    }

    void loadJobs()

    return () => {
      cancelled = true
    }
  }, [])

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
                  {TRACKER_SKELETON_KEYS.map(key => (
                    <Skeleton key={key} className="h-20 w-full rounded-xl" />
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
