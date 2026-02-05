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

  // 操作
  init: () => Promise<void>
  setViewMode: (mode: ViewMode) => void
  updateJobStatus: (jobId: string, status: ApplicationStatus) => Promise<void>
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

  init: async () => {
    set({ loading: true })
    try {
      const jobs = await getCompanies()
      set({ jobs, loading: false })
    }
    catch (error) {
      console.error('Failed to load jobs:', error)
      toast.error('加载失败')
      set({ loading: false })
    }
  },

  setViewMode: mode => set({ viewMode: mode }),

  updateJobStatus: async (jobId, status) => {
    try {
      await updateCompanyStatus(jobId, status)
      const { jobs } = get()
      const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, status } : j)
      set({ jobs: updatedJobs })
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
      console.error('Failed to update status:', error)
      toast.error('更新状态失败')
    }
  },

  updateJob: async (job) => {
    try {
      const updated = await updateCompany(job.id, job)
      set(state => ({
        jobs: state.jobs.map(j => j.id === job.id ? updated : j),
      }))
      toast.success('更新成功')
    }
    catch (error) {
      console.error('Failed to update job:', error)
      toast.error('更新失败')
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
      toast.error('添加失败')
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
      toast.error('删除失败')
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
