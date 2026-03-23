import type { ApplicationStatus, JobApplication, ViewMode } from '../types'
import { useCallback } from 'react'
import useTrackerStore from '../store'

export function useTrackerUiActions() {
  const setViewMode = useCallback((mode: ViewMode) => {
    useTrackerStore.setState({ viewMode: mode })
  }, [])

  const setFilterStatus = useCallback((status: ApplicationStatus | null) => {
    useTrackerStore.setState({ filterStatus: status })
  }, [])

  const enterSelectMode = useCallback(() => {
    useTrackerStore.setState({ isSelectMode: true, selectedIds: new Set() })
  }, [])

  const exitSelectMode = useCallback(() => {
    useTrackerStore.setState({ isSelectMode: false, selectedIds: new Set() })
  }, [])

  const toggleSelect = useCallback((id: string) => {
    useTrackerStore.setState((state) => {
      const next = new Set(state.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedIds: next }
    })
  }, [])

  const selectAll = useCallback(() => {
    useTrackerStore.setState((state) => ({
      selectedIds: state.selectedIds.size === state.jobs.length
        ? new Set()
        : new Set(state.jobs.map(job => job.id)),
    }))
  }, [])

  const openJobDrawer = useCallback((job: JobApplication) => {
    useTrackerStore.setState({ selectedJob: job, drawerOpen: true })
  }, [])

  const closeJobDrawer = useCallback(() => {
    useTrackerStore.setState({ drawerOpen: false })
  }, [])

  const openAddDrawer = useCallback(() => {
    useTrackerStore.setState({ addDrawerOpen: true })
  }, [])

  const closeAddDrawer = useCallback(() => {
    useTrackerStore.setState({ addDrawerOpen: false })
  }, [])

  return {
    setViewMode,
    setFilterStatus,
    enterSelectMode,
    exitSelectMode,
    toggleSelect,
    selectAll,
    openJobDrawer,
    closeJobDrawer,
    openAddDrawer,
    closeAddDrawer,
  }
}
