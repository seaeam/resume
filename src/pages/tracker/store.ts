import type { ApplicationStatus, JobApplication, ViewMode } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { createCompany, deleteCompany, getCompanies, updateCompany } from '@/lib/supabase/resume'
import { autoCompleteStages } from './utils'

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

  // Drawer
  selectedJob: JobApplication | null
  drawerOpen: boolean
  addDrawerOpen: boolean

  // 初始化
  init: () => Promise<void>

  // 视图
  setViewMode: (mode: ViewMode) => void

  // 数据操作
  changeJobStatus: (jobId: string, newStatus: ApplicationStatus) => Promise<void>
  updateJob: (job: JobApplication) => Promise<void>
  addJob: (job: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>
  deleteSelectedJobs: () => Promise<void>

  // 选择模式
  enterSelectMode: () => void
  exitSelectMode: () => void
  toggleSelect: (id: string) => void
  selectAll: () => void

  // Drawer 操作
  openJobDrawer: (job: JobApplication) => void
  closeJobDrawer: () => void
  openAddDrawer: () => void
  closeAddDrawer: () => void
}

const useTrackerStore = create<TrackerStore>()((set, get) => ({
  // 初始状态
  jobs: [],
  viewMode: 'list',
  loading: false,
  error: null,
  isInitialized: false,

  // 选择模式
  selectedIds: new Set(),
  isSelectMode: false,

  // Drawer
  selectedJob: null,
  drawerOpen: false,
  addDrawerOpen: false,

  init: async () => {
    if (get().isInitialized || get().loading) {
      return
    }

    set({ loading: true, error: null })
    try {
      const jobs = await getCompanies()
      set({ jobs, loading: false, error: null, isInitialized: true })
    }
    catch (error) {
      let errorMessage = '加载失败'
      let errorDetail = ''

      if (error instanceof Error) {
        if (error.message.includes('未登陆') || error.message.includes('not authenticated')) {
          errorMessage = '请先登录'
          errorDetail = '需要登录后才能查看职位追踪'
        }
        else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络连接失败'
          errorDetail = '请检查网络连接后重试'
        }
        else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = '权限不足'
          errorDetail = '无法访问职位数据，请联系管理员'
        }
        else if (error.message.includes('database') || error.message.includes('relation')) {
          errorMessage = '数据库错误'
          errorDetail = '数据表可能不存在或结构异常'
        }
        else {
          errorMessage = '加载失败'
          errorDetail = error.message
        }
      }

      set({ loading: false, error: errorMessage })
      toast.error(errorMessage, { description: errorDetail })
    }
  },

  setViewMode: mode => set({ viewMode: mode }),

  changeJobStatus: async (jobId, newStatus) => {
    const { jobs, selectedJob } = get()
    const job = jobs.find(j => j.id === jobId)
    if (!job)
      return

    const previousJobs = jobs
    const previousSelectedJob = selectedJob

    const updatedStageDetails = autoCompleteStages(job.status, newStatus, job.stage_details)
    const updatedJob = { ...job, status: newStatus, stage_details: updatedStageDetails }

    // 乐观更新
    set({
      jobs: jobs.map(j => j.id === jobId ? updatedJob : j),
      selectedJob: selectedJob?.id === jobId ? updatedJob : selectedJob,
    })

    try {
      await updateCompany(jobId, updatedJob)

      if (newStatus === 'offer') {
        toast.success('Offer🎉')
      }
      else if (newStatus === 'rejected') {
        toast.error('终止流程')
      }
    }
    catch (error) {
      set({ jobs: previousJobs, selectedJob: previousSelectedJob })
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('更新状态失败', { description: errorMsg })
    }
  },

  updateJob: async (job) => {
    const previousJobs = get().jobs
    const previousSelectedJob = get().selectedJob

    // 乐观更新
    set(state => ({
      jobs: state.jobs.map(j => j.id === job.id ? job : j),
      selectedJob: state.selectedJob?.id === job.id ? job : state.selectedJob,
    }))

    try {
      const updated = await updateCompany(job.id, job)
      set(state => ({
        jobs: state.jobs.map(j => j.id === job.id ? updated : j),
        selectedJob: state.selectedJob?.id === updated.id ? updated : state.selectedJob,
      }))
    }
    catch (error) {
      set({ jobs: previousJobs, selectedJob: previousSelectedJob })
      console.error('Failed to update job:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('更新失败', { description: errorMsg })
    }
  },

  addJob: async (jobData) => {
    try {
      const newJob = await createCompany(jobData)
      set(state => ({ jobs: [newJob, ...state.jobs] }))
      toast.success('添加成功')
    }
    catch (error) {
      console.error('Failed to add job:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('添加失败', { description: errorMsg })
    }
  },

  deleteSelectedJobs: async () => {
    const { selectedIds, jobs } = get()
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => deleteCompany(id)),
      )
      set({
        jobs: jobs.filter(j => !selectedIds.has(j.id)),
        selectedIds: new Set(),
        isSelectMode: false,
      })
      toast.success(`已删除 ${selectedIds.size} 个职位`)
    }
    catch (error) {
      console.error('Failed to delete jobs:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('删除失败', { description: errorMsg })
    }
  },

  enterSelectMode: () => set({ isSelectMode: true, selectedIds: new Set() }),

  exitSelectMode: () => set({ isSelectMode: false, selectedIds: new Set() }),

  toggleSelect: (id) => {
    set((state) => {
      const next = new Set(state.selectedIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { selectedIds: next }
    })
  },

  selectAll: () => {
    const { jobs, selectedIds } = get()
    if (selectedIds.size === jobs.length) {
      set({ selectedIds: new Set() })
    }
    else {
      set({ selectedIds: new Set(jobs.map(j => j.id)) })
    }
  },

  openJobDrawer: job => set({ selectedJob: job, drawerOpen: true }),
  closeJobDrawer: () => set({ drawerOpen: false }),
  openAddDrawer: () => set({ addDrawerOpen: true }),
  closeAddDrawer: () => set({ addDrawerOpen: false }),
}))

export default useTrackerStore
