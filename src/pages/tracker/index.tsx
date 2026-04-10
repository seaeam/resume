import type { ApplicationStatus } from './types'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { getCompanies } from '@/lib/supabase/resume'
import BoardView from './components/board/index'
import JobDrawer from './components/drawer'
import AddJobDrawer from './components/drawer/add-job'
import TrackerHeader from './components/header'
import ListView from './components/list'
import StatusFilter from './components/status-filter'
import { ALL_FILTER_STATUSES } from './components/status-filter/const'
import useTrackerStore from './store'
import { getTrackerLoadErrorMeta } from './utils'

const TRACKER_SKELETON_KEYS = ['tracker-skeleton-1', 'tracker-skeleton-2', 'tracker-skeleton-3'] as const

function Tracker() {
  const { viewMode, loading, filterStatus, setFilterStatus } = useTrackerStore()
  const activeFilterValue = filterStatus ?? 'all'

  useEffect(() => {
    const currentState = useTrackerStore.getState()
    if (currentState.isInitialized || currentState.loading)
      return

    const loadJobs = async () => {
      useTrackerStore.setState({ loading: true, error: null })

      try {
        const jobs = await getCompanies()
        useTrackerStore.setState({ jobs, loading: false, error: null, isInitialized: true })
      }
      catch (error) {
        const { message, description } = getTrackerLoadErrorMeta(error)
        useTrackerStore.setState({ loading: false, error: message })
        toast.error(message, { description })
      }
    }

    loadJobs()
  }, [])

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col gap-4">
          {TRACKER_SKELETON_KEYS.map(key => (
            <Skeleton key={key} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )
    }

    return viewMode === 'list' ? <ListView /> : <BoardView />
  }

  return (
    <>
      <Tabs
        value={activeFilterValue}
        className="w-full"
        onValueChange={(value) => {
          if (!value)
            return
          setFilterStatus(value === 'all' ? null : value as ApplicationStatus)
        }}
      >
        <div className="flex flex-col gap-6 p-4 md:p-8 w-full max-w-7xl mx-auto">
          <TrackerHeader />

          <StatusFilter />

          <main className="w-full overflow-hidden">
            {ALL_FILTER_STATUSES.map((status) => {
              const value = status ?? 'all'
              return (
                <TabsContent key={value} value={value} className="mt-0">
                  {renderMainContent()}
                </TabsContent>
              )
            })}
          </main>
        </div>
      </Tabs>

      <JobDrawer />
      <AddJobDrawer />
    </>
  )
}

export default Tracker
