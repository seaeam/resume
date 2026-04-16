import type { TemplateRecord } from '@/lib/resume-template/schema'
import { toast } from 'sonner'
import { create } from 'zustand'
import { deleteUserTemplate as deleteUserTemplateApi, updateUserTemplate } from '@/lib/supabase/template'
import { updateTemplateMeta } from '../utils'
import useCommunityTemplatesStore from './community-templates'
import useTemplateEditorStore from './editor'
import { mergeCommunityTemplates, reconcileTemplateForUi, upsertTemplate } from './shared'

interface UserTemplatesState {
  userTemplates: TemplateRecord[]
  lastOpenedUserTemplateId: string | null
  setUserTemplates: (templates: TemplateRecord[]) => void
  setLastOpenedUserTemplateId: (id: string | null) => void
  findTemplate: (templateId: string | null) => TemplateRecord | null
  findLastOpenedTemplate: () => TemplateRecord | null
  hydrateTemplateDraft: (template: TemplateRecord) => void
  upsertAndSync: (template: TemplateRecord) => void
  removeAndSync: (templateId: string) => void
  togglePublish: (templateId: string, nextVisibility: 'private' | 'published') => Promise<void>
  deleteTemplate: (templateId: string) => Promise<void>
}

const useUserTemplatesStore = create<UserTemplatesState>()((set, get) => ({
  userTemplates: [],
  lastOpenedUserTemplateId: null,

  setUserTemplates: templates => set({ userTemplates: templates }),

  setLastOpenedUserTemplateId: id => set({ lastOpenedUserTemplateId: id }),

  findTemplate: (templateId) => {
    if (!templateId) {
      return null
    }

    return get().userTemplates.find(template => template.id === templateId) ?? null
  },

  findLastOpenedTemplate: () => {
    const { userTemplates, lastOpenedUserTemplateId } = get()

    if (!lastOpenedUserTemplateId) {
      return null
    }

    return userTemplates.find(template => template.id === lastOpenedUserTemplateId) ?? null
  },

  hydrateTemplateDraft: (template) => {
    useTemplateEditorStore.getState().hydrateDraft({
      templateId: template.id,
      manifest: template.manifest,
      publishIntent: template.meta.visibility,
    })
  },

  upsertAndSync: (template) => {
    const nextUserTemplates = upsertTemplate(get().userTemplates, template)
    const communityStore = useCommunityTemplatesStore.getState()
    const nextCommunityTemplates = mergeCommunityTemplates(communityStore.communityTemplates, nextUserTemplates)

    set({ userTemplates: nextUserTemplates })
    communityStore.setCommunityTemplates(nextCommunityTemplates)
  },

  removeAndSync: (templateId) => {
    const nextUserTemplates = get().userTemplates.filter(template => template.id !== templateId)
    const communityStore = useCommunityTemplatesStore.getState()
    const nextCommunityTemplates = mergeCommunityTemplates(
      communityStore.communityTemplates.filter(template => template.id !== templateId),
      nextUserTemplates,
    )

    set(state => ({
      userTemplates: nextUserTemplates,
      lastOpenedUserTemplateId: state.lastOpenedUserTemplateId === templateId ? null : state.lastOpenedUserTemplateId,
    }))
    communityStore.setCommunityTemplates(nextCommunityTemplates)
  },

  togglePublish: async (templateId, nextVisibility) => {
    const current = get().userTemplates.find(template => template.id === templateId)

    if (!current) {
      toast.error('模板不存在或已被移除')
      return
    }

    try {
      const updatedTemplate = await updateUserTemplate(templateId, {
        manifest: updateTemplateMeta(current.manifest, { visibility: nextVisibility, status: 'active' }),
        visibility: nextVisibility,
        status: 'active',
      })
      const syncedTemplate = reconcileTemplateForUi(updatedTemplate, {
        manifest: updateTemplateMeta(current.manifest, { visibility: nextVisibility, status: 'active' }),
        visibility: nextVisibility,
        status: 'active',
      })

      get().upsertAndSync(syncedTemplate)
      toast.success(nextVisibility === 'published' ? '模板已发布到社区' : '模板已取消发布')
    }
    catch (publishError) {
      toast.error('模板状态更新失败', {
        description: publishError instanceof Error ? publishError.message : '请稍后重试',
      })
    }
  },

  deleteTemplate: async (templateId) => {
    await deleteUserTemplateApi(templateId)
    get().removeAndSync(templateId)
  },
}))

export default useUserTemplatesStore
