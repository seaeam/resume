import type { ResumeItem } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { deleteOfflineResume, getAllOfflineResumes, isOfflineResumeId } from '@/lib/offline-resume-manager'
import { syncOfflineResumesToCloud } from '@/lib/resume-sync-service'
import { subscribeToResumeConfigUpdates } from '@/lib/supabase/resume'
import { deleteResume as deleteResumeApi, getAllResumesFromUser } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import { getErrorMessage } from '@/utils'

interface ResumeListState {
  resumes: ResumeItem[]
  loading: boolean
  isOnline: boolean
  showSyncDialog: boolean
  offlineResumes: ResumeItem[]
  isSyncing: boolean
  syncingIds: Set<string>
  _localDeletingIds: Set<string>

  // Actions
  loadResumes: () => Promise<void>
  deleteResume: (id: string) => void
  syncResumes: (selectedIds: string[]) => Promise<void>
  updateResume: (resumeId: string, updates: { display_name: string, description: string }) => void
  addResume: (resume: ResumeItem) => void
  setShowSyncDialog: (show: boolean) => void
  setupRealtimeSubscription: () => () => void
}

const useResumeListStore = create<ResumeListState>()((set, get) => ({
  resumes: [],
  loading: true,
  isOnline: false,
  showSyncDialog: false,
  offlineResumes: [],
  isSyncing: false,
  syncingIds: new Set<string>(),
  _localDeletingIds: new Set<string>(),

  loadResumes: async () => {
    try {
      const user = await getCurrentUser()
      set({ isOnline: !!user })

      let allResumes: ResumeItem[] = []

      // 加载在线简历（如果已登录）
      if (user) {
        try {
          const onlineResumes = await getAllResumesFromUser()
          allResumes = onlineResumes.map(r => ({ ...r, isOffline: false }))
        }
        catch (error: unknown) {
          if (getErrorMessage(error) !== '用户未登陆') {
            toast.error('加载在线简历失败')
          }
        }
      }

      // 加载离线简历
      const localResumes = await getAllOfflineResumes()
      const formattedOfflineResumes: ResumeItem[] = localResumes.map(r => ({
        ...r,
        isOffline: true,
      }))

      allResumes = [...allResumes, ...formattedOfflineResumes]
      set({ resumes: allResumes })

      // 如果已登录且有本地简历，提示用户
      if (user && formattedOfflineResumes.length > 0) {
        set({ offlineResumes: formattedOfflineResumes })
        toast.info(`检测到 ${formattedOfflineResumes.length} 个本地简历，点击右上角按钮可同步到云端`)
      }
    }
    catch (error) {
      toast.error('加载简历失败')
      console.warn(error)
    }
    finally {
      set({ loading: false })
    }
  },

  deleteResume: (id: string) => {
    const isOffline = isOfflineResumeId(id)

    // 如果是在线简历，标记为本地删除（避免订阅重复处理）
    if (!isOffline) {
      set((state) => {
        const newSet = new Set(state._localDeletingIds)
        newSet.add(id)
        return { _localDeletingIds: newSet }
      })
    }

    const deletePromise = isOffline
      ? deleteOfflineResume(id).then(() => {
          set(state => ({
            resumes: state.resumes.filter(r => r.resume_id !== id),
            offlineResumes: state.offlineResumes.filter(r => r.resume_id !== id),
          }))
        })
      : deleteResumeApi(id).then(() => {
          set(state => ({
            resumes: state.resumes.filter(r => r.resume_id !== id),
          }))
        })

    toast.promise(deletePromise, {
      loading: '正在删除简历...',
      success: '简历已删除',
      error: () => {
        // 删除失败，清除本地删除标记
        if (!isOffline) {
          set((state) => {
            const newSet = new Set(state._localDeletingIds)
            newSet.delete(id)
            return { _localDeletingIds: newSet }
          })
        }
        return '删除失败，请重试'
      },
    })
  },

  syncResumes: async (selectedIds: string[]) => {
    if (selectedIds.length === 0)
      return

    set({ isSyncing: true, syncingIds: new Set(selectedIds) })

    try {
      const result = await syncOfflineResumesToCloud(selectedIds)

      if (result.success > 0) {
        // 先移除已同步的本地简历
        set(state => ({
          resumes: state.resumes.filter(r => !selectedIds.includes(r.resume_id)),
        }))

        // 重新加载在线简历
        const onlineResumes = await getAllResumesFromUser()
        const newOnlineResumes = onlineResumes.map(r => ({ ...r, isOffline: false }))

        set((state) => {
          const offline = state.resumes.filter(r => r.isOffline)
          const remaining = state.offlineResumes.filter(r => !selectedIds.includes(r.resume_id))
          return {
            resumes: [...newOnlineResumes, ...offline],
            offlineResumes: remaining,
            showSyncDialog: remaining.length === 0 ? false : state.showSyncDialog,
          }
        })

        toast.success(`已同步 ${result.success} 个简历到云端`)
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} 个简历同步失败`)
      }
    }
    catch {
      toast.error('同步失败，请稍后重试')
    }
    finally {
      set({ isSyncing: false, syncingIds: new Set() })
    }
  },

  updateResume: (resumeId, updates) => {
    set(state => ({
      resumes: state.resumes.map(r =>
        r.resume_id === resumeId ? { ...r, ...updates } : r,
      ),
      offlineResumes: resumeId.startsWith('local-')
        ? state.offlineResumes.map(r =>
            r.resume_id === resumeId ? { ...r, ...updates } : r,
          )
        : state.offlineResumes,
    }))
  },

  addResume: (resume) => {
    set(state => ({
      resumes: state.resumes.some(item => item.resume_id === resume.resume_id)
        ? state.resumes
        : [resume, ...state.resumes],
      offlineResumes: resume.isOffline && !state.offlineResumes.some(item => item.resume_id === resume.resume_id)
        ? [resume, ...state.offlineResumes]
        : state.offlineResumes,
    }))
  },

  setShowSyncDialog: show => set({ showSyncDialog: show }),

  setupRealtimeSubscription: () => {
    let cancelled = false
    let unSubscribe: (() => void) | undefined

    subscribeToResumeConfigUpdates((payload) => {
      if (cancelled)
        return

      switch (payload.eventType) {
        case 'INSERT': {
          const resume: ResumeItem = {
            resume_id: payload.new.resume_id,
            created_at: payload.new.created_at,
            updated_at: payload.new.updated_at,
            type: payload.new.type,
            display_name: payload.new.display_name,
            description: payload.new.description,
            isOffline: false,
          }
          set((state) => {
            if (state.resumes.some(r => r.resume_id === resume.resume_id)) {
              return state
            }
            return { resumes: [resume, ...state.resumes] }
          })
          break
        }
        case 'UPDATE': {
          set(state => ({
            resumes: state.resumes.map(r =>
              r.resume_id === payload.new.resume_id
                ? {
                    ...r,
                    display_name: payload.new.display_name,
                    description: payload.new.description,
                    updated_at: payload.new.updated_at,
                  }
                : r,
            ),
          }))
          break
        }
        case 'DELETE': {
          const deletedResumeId = payload.old.resume_id
          const { _localDeletingIds, resumes } = get()
          const existsLocally = resumes.some(resume => resume.resume_id === deletedResumeId)

          // 当前页主动删除时，可能先本地移除了列表项，再收到实时 DELETE。
          // 这类情况不应再展示“已同步删除”提示，但其他页面仍需提示。
          if (_localDeletingIds.has(deletedResumeId) || !existsLocally) {
            set((state) => {
              const newSet = new Set(state._localDeletingIds)
              newSet.delete(deletedResumeId)
              return { _localDeletingIds: newSet }
            })
            break
          }

          // 是远程删除，需要同步
          const syncPromise = async () => {
            const onlineResumes = await getAllResumesFromUser()
            const formattedOnlineResumes = onlineResumes.map(r => ({ ...r, isOffline: false }))

            set((state) => {
              const offlineOnly = state.resumes.filter(r => r.isOffline)
              return { resumes: [...formattedOnlineResumes, ...offlineOnly] }
            })
          }

          toast.promise(syncPromise, {
            loading: '检测到简历变动，正在同步...',
            success: '简历已同步删除',
            error: '同步失败，请重试',
          })
          break
        }
      }
    })
      .then((unsub) => {
        if (cancelled) {
          unsub?.()
        }
        else {
          unSubscribe = unsub
        }
      })
      .catch((error) => {
        console.error(error.message)
      })

    return () => {
      cancelled = true
      unSubscribe?.()
    }
  },
}))

export default useResumeListStore
