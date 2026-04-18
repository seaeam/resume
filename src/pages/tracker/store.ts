import type { ApplicationStatus, JobApplication, ViewMode } from './types'
import { create } from 'zustand'
import { filterJobs } from './utils'

interface TrackerJobsSnapshot {
  jobs: JobApplication[]
  selectedJob: JobApplication | null
}

interface TrackerStore {
  // 数据
  jobs: JobApplication[]
  viewMode: ViewMode
  loading: boolean
  error: string | null
  isInitialized: boolean

  // 选择模式
  selectedIds: Set<string>
  isSelectMode: boolean

  // 筛选
  filterStatus: ApplicationStatus | null
  searchKeyword: string

  // Drawer
  selectedJob: JobApplication | null
  drawerOpen: boolean
  addDrawerOpen: boolean

  // 共享状态操作
  setViewMode: (mode: ViewMode) => void
  setFilterStatus: (status: ApplicationStatus | null) => void
  setSearchKeyword: (keyword: string) => void
  enterSelectMode: () => void
  exitSelectMode: () => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  openJobDrawer: (job: JobApplication) => void
  closeJobDrawer: () => void
  openAddDrawer: () => void
  closeAddDrawer: () => void
  syncJob: (job: JobApplication) => void
  restoreJobsSnapshot: (snapshot: TrackerJobsSnapshot) => void
  removeJobs: (ids: Iterable<string>) => void
  prependJob: (job: JobApplication) => void
}

const useTrackerStore = create<TrackerStore>()(set => ({
  // 初始状态
  jobs: [],
  viewMode: 'list',
  loading: false,
  error: null,
  isInitialized: false,

  // 选择模式
  selectedIds: new Set(),
  isSelectMode: false,

  // 筛选
  filterStatus: null,
  searchKeyword: '',

  // Drawer
  selectedJob: null,
  drawerOpen: false,
  addDrawerOpen: false,

  // 共享状态操作
  setViewMode: mode => set({ viewMode: mode }),
  setFilterStatus: status => set({ filterStatus: status }),
  setSearchKeyword: keyword => set({ searchKeyword: keyword }),
  enterSelectMode: () => set({ isSelectMode: true, selectedIds: new Set() }),
  exitSelectMode: () => set({ isSelectMode: false, selectedIds: new Set() }),
  toggleSelect: (id) => {
    set((state) => {
      const nextSelectedIds = new Set(state.selectedIds)
      if (nextSelectedIds.has(id)) {
        nextSelectedIds.delete(id)
      }
      else {
        nextSelectedIds.add(id)
      }
      return { selectedIds: nextSelectedIds }
    })
  },
  selectAll: () => {
    set((state) => {
      const selectableJobs = filterJobs(state.jobs, state.filterStatus, state.searchKeyword)

      return {
        selectedIds: state.selectedIds.size === selectableJobs.length
          ? new Set()
          : new Set(selectableJobs.map(job => job.id)),
      }
    })
  },
  openJobDrawer: job => set({ selectedJob: job, drawerOpen: true }),
  closeJobDrawer: () => set({ drawerOpen: false }),
  openAddDrawer: () => set({ addDrawerOpen: true }),
  closeAddDrawer: () => set({ addDrawerOpen: false }),
  syncJob: (job) => {
    set(state => ({
      jobs: state.jobs.map(current => current.id === job.id ? job : current),
      selectedJob: state.selectedJob?.id === job.id ? job : state.selectedJob,
    }))
  },
  restoreJobsSnapshot: snapshot => set(snapshot),
  removeJobs: (ids) => {
    const idsSet = ids instanceof Set ? ids : new Set(ids)

    set((state) => {
      const deletingSelectedJob = state.selectedJob ? idsSet.has(state.selectedJob.id) : false
      const nextSelectedIds = new Set(
        Array.from(state.selectedIds).filter(id => !idsSet.has(id)),
      )

      return {
        jobs: state.jobs.filter(job => !idsSet.has(job.id)),
        selectedIds: nextSelectedIds,
        isSelectMode: false,
        selectedJob: deletingSelectedJob ? null : state.selectedJob,
        drawerOpen: deletingSelectedJob ? false : state.drawerOpen,
      }
    })
  },
  prependJob: job => set(state => ({ jobs: [job, ...state.jobs] })),
}))

export default useTrackerStore
