import type { ApplicationStatus, JobApplication, ViewMode } from './types'
import { create } from 'zustand'

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

  // Drawer
  selectedJob: JobApplication | null
  drawerOpen: boolean
  addDrawerOpen: boolean
}

const useTrackerStore = create<TrackerStore>()(() => ({
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

  // Drawer
  selectedJob: null,
  drawerOpen: false,
  addDrawerOpen: false,
}))

export default useTrackerStore
