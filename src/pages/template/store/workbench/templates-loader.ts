import type { NavigateFunction } from 'react-router-dom'
import type { StoreApi } from 'zustand'
import type { LoadTemplateOptions } from '../shared'
import type { WorkbenchState } from './types'
import { listPublishedCommunityTemplates, listUserTemplates } from '@/lib/supabase/template'
import useCommunityTemplatesStore from '../community-templates'
import { mergeCommunityTemplates, mergeUserTemplates, reconcileLastOpenedUserTemplateId } from '../shared'
import useUserTemplatesStore from '../user-templates'

export interface TemplatesLoaderSlice {
  loading: boolean
  error: string | null
  navigate: NavigateFunction | null
  setNavigate: (navigate: NavigateFunction | null) => void
  loadTemplates: (options?: LoadTemplateOptions) => Promise<void>
}

type Set = StoreApi<WorkbenchState>['setState']

export function createTemplatesLoaderSlice(set: Set): TemplatesLoaderSlice {
  return {
    loading: true,
    error: null,
    navigate: null,

    setNavigate: navigate => set({ navigate }),

    loadTemplates: async (options) => {
      if (!options?.silent)
        set({ loading: true })
      set({ error: null })

      try {
        const [communityTemplates, userTemplates] = await Promise.all([
          listPublishedCommunityTemplates(),
          listUserTemplates(),
        ])

        const userStore = useUserTemplatesStore.getState()
        const nextUserTemplates = mergeUserTemplates(userTemplates, userStore.userTemplates)

        userStore.setUserTemplates(nextUserTemplates)
        userStore.setLastOpenedUserTemplateId(
          reconcileLastOpenedUserTemplateId(userTemplates, userStore.lastOpenedUserTemplateId),
        )
        useCommunityTemplatesStore.getState().setCommunityTemplates(
          mergeCommunityTemplates(communityTemplates, nextUserTemplates),
        )
      }
      catch (loadError) {
        set({
          error: loadError instanceof Error ? loadError.message : '加载模板失败',
        })
      }
      finally {
        if (!options?.silent)
          set({ loading: false })
      }
    },
  }
}
