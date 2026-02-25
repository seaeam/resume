import type { ApplicationStatus, JobApplication, ViewMode } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import {
  createCompany,
  deleteCompany,
  getCompanies,
  updateCompany,
  updateCompanyStatus,
} from '@/lib/supabase/resume'

interface TrackerStore {
  // 状态
  jobs: JobApplication[]
  viewMode: ViewMode
  selectedIds: Set<string>
  isSelectMode: boolean
  loading: boolean
  error: string | null
  isInitialized: boolean

  // 操作
  init: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
  updateJobStatus: (jobId: string, status: ApplicationStatus) => Promise<void>
  updateJobLocal: (job: JobApplication) => void
  updateJob: (job: JobApplication) => Promise<void>
  addJob: (job: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => Promise<void>
  deleteSelectedJobs: () => Promise<void>

  // 选择模式
  enterSelectMode: () => void
  exitSelectMode: () => void
  toggleSelect: (id: string) => void
  selectAll: () => void
}

const useTrackerStore = create<TrackerStore>()((set, get) => ({
  // 初始状态
  jobs: [],
  viewMode: 'list',
  selectedIds: new Set(),
  isSelectMode: false,
  loading: false,
  error: null,
  isInitialized: false,

  init: async () => {
    // 防止重复初始化（React Strict Mode 会导致 useEffect 执行两次）
    if (get().isInitialized || get().loading) {
      return
    }

    set({ loading: true, error: null })
    try {
      const jobs = await getCompanies()
      set({ jobs, loading: false, error: null, isInitialized: true })
    }
    catch (error) {
      // console.error('Failed to load jobs:', error)

      // 详细的错误处理
      let errorMessage = '加载失败'
      let errorDetail = ''

      if (error instanceof Error) {
        // 认证错误
        if (error.message.includes('未登陆') || error.message.includes('not authenticated')) {
          errorMessage = '请先登录'
          errorDetail = '需要登录后才能查看职位追踪'
        }
        // 网络错误
        else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络连接失败'
          errorDetail = '请检查网络连接后重试'
        }
        // 权限错误
        else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = '权限不足'
          errorDetail = '无法访问职位数据，请联系管理员'
        }
        // 数据库错误
        else if (error.message.includes('database') || error.message.includes('relation')) {
          errorMessage = '数据库错误'
          errorDetail = '数据表可能不存在或结构异常'
        }
        // 其他错误
        else {
          errorMessage = '加载失败'
          errorDetail = error.message
        }
      }

      set({ loading: false, error: errorMessage })

      // 显示用户友好的错误提示
      toast.error(errorMessage, {
        description: errorDetail,
      })
    }
  },

  setViewMode: mode => set({ viewMode: mode }),

  updateJobStatus: async (jobId, status) => {
    // 这里有个延迟更新的优化问题，由于采用先请求API，然后进行更新，会造成用户体验卡顿
    // 这里改为使用乐观更新，先更新UI，再去请求API，并且设置一个旧状态用于回滚
    const { jobs } = get()
    const previousJobs = jobs// 保存旧状态用于回滚
    set({ jobs: jobs.map(job => job.id === jobId ? { ...job, status } : job) })
    try {
      await updateCompanyStatus(jobId, status)

      // 特殊状态的 toast 提示
      if (status === 'offer') {
        toast.success('Offer🎉')
      }
      else if (status === 'rejected') {
        toast.error('Reject😅')
      }
      else {
        toast.success(`状态已更新为 ${status}`)
      }
    }
    catch (error) {
      // console.error('Failed to update status:', error)
      // 如果报错 那就回滚
      set({ jobs: previousJobs })
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('更新状态失败', {
        description: errorMsg,
      })
    }
  },

  updateJobLocal: (job) => {
    set(state => ({
      jobs: state.jobs.map(j => j.id === job.id ? job : j),
    }))
  },

  updateJob: async (job) => {
    try {
      const updated = await updateCompany(job.id, job)
      set(state => ({
        jobs: state.jobs.map(j => j.id === job.id ? updated : j),
      }))
    }
    catch (error) {
      console.error('Failed to update job:', error)
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      toast.error('更新失败', {
        description: errorMsg,
      })
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
      toast.error('添加失败', {
        description: errorMsg,
      })
    }
  },

  deleteSelectedJobs: async () => {
    const { selectedIds, jobs } = get()
    try {
      // 并行删除所有选中的
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
      toast.error('删除失败', {
        description: errorMsg,
      })
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
}))

export default useTrackerStore
