import type { NavigateFunction } from 'react-router-dom'
import type { LoadTemplateOptions, TemplateWorkbenchMode, TemplateWorkbenchSource, TemplateWorkbenchTab } from './shared'
import { toast } from 'sonner'
import { create } from 'zustand'
import { createResumeFromTemplate } from '@/lib/supabase/resume/form'
import { createUserTemplate, listPublishedCommunityTemplates, listUserTemplates, updateUserTemplate } from '@/lib/supabase/template'
import useResumeListStore from '@/pages/resume/store'
import useCurrentResumeStore from '@/store/resume/current'
import { updateTemplateMeta, validateTemplateForPublish, validateTemplateForSave } from '../utils'
import useCommunityTemplatesStore from './community-templates'
import useTemplateEditorStore from './editor'
import useOfficialTemplatesStore from './official-templates'
import { mergeCommunityTemplates, mergeUserTemplates, reconcileLastOpenedUserTemplateId, reconcileTemplateForUi } from './shared'
import useUserTemplatesStore from './user-templates'

interface TemplateWorkbenchState {
  activeTab: TemplateWorkbenchTab
  mode: TemplateWorkbenchMode
  source: TemplateWorkbenchSource
  selectedTemplateId: string | null
  loading: boolean
  error: string | null
  navigate: NavigateFunction | null

  setNavigate: (navigate: NavigateFunction | null) => void
  loadTemplates: (options?: LoadTemplateOptions) => Promise<void>
  setTab: (tab: TemplateWorkbenchTab) => void
  getRecommendedHeroSecondaryAction: () => { label: string, onClick: () => void }
  openLibrary: (tab?: TemplateWorkbenchTab) => void
  openOfficialTemplateEditor: (templateId: string) => void
  openUserTemplateEditor: (templateId: string) => void
  createResumeWithTemplate: (sourceKind: 'official' | 'community' | 'user', templateId: string) => Promise<void>
  customizeOfficialTemplate: (templateId: string) => void
  customizeCommunityTemplate: (templateId: string) => Promise<void>
  toggleUserTemplatePublish: (templateId: string, nextVisibility: 'private' | 'published') => Promise<void>
  deleteUserTemplateRecord: (templateId: string) => Promise<void>
  saveActiveTemplate: () => Promise<void>
  saveActiveTemplateAsCopy: () => Promise<void>
  resetActiveTemplateDraft: () => void
}

const useTemplateWorkbenchStore = create<TemplateWorkbenchState>()((set, get) => ({
  activeTab: 'official',
  mode: 'library',
  source: null,
  selectedTemplateId: null,
  loading: true,
  error: null,
  navigate: null,

  setNavigate: navigate => set({ navigate }),

  loadTemplates: async (options) => {
    if (!options?.silent) {
      set({ loading: true })
    }
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
      if (!options?.silent) {
        set({ loading: false })
      }
    }
  },

  setTab: activeTab => set({ activeTab }),

  getRecommendedHeroSecondaryAction: () => {
    const userStore = useUserTemplatesStore.getState()
    const lastOpenedTemplate = userStore.findLastOpenedTemplate()

    if (lastOpenedTemplate) {
      return {
        label: '继续编辑最近模板',
        onClick: () => get().openUserTemplateEditor(lastOpenedTemplate.id),
      }
    }

    if (userStore.userTemplates.length > 0) {
      return {
        label: '查看我的模板',
        onClick: () => get().setTab('mine'),
      }
    }

    return {
      label: '创建第一个模板',
      onClick: () => get().setTab('official'),
    }
  },

  openLibrary: (tab) => {
    useTemplateEditorStore.getState().resetEditor()
    set(state => ({
      activeTab: tab ?? state.activeTab,
      mode: 'library',
      source: null,
      selectedTemplateId: null,
    }))
  },

  openOfficialTemplateEditor: (templateId) => {
    useOfficialTemplatesStore.getState().hydrateTemplateDraft(templateId)
    set({
      mode: 'editor',
      source: 'official',
      selectedTemplateId: templateId,
    })
  },

  openUserTemplateEditor: (templateId) => {
    const userStore = useUserTemplatesStore.getState()
    const template = userStore.findTemplate(templateId)

    if (!template) {
      toast.error('模板不存在或已被移除')
      return
    }

    userStore.hydrateTemplateDraft(template)
    set({
      mode: 'editor',
      source: 'user',
      selectedTemplateId: templateId,
    })
    userStore.setLastOpenedUserTemplateId(templateId)
  },

  createResumeWithTemplate: async (sourceKind, templateId) => {
    try {
      const createdResume = await createResumeFromTemplate({
        source: sourceKind,
        templateId,
      })

      useResumeListStore.getState().addResume({
        resume_id: createdResume.resume_id,
        created_at: createdResume.created_at,
        updated_at: createdResume.updated_at,
        type: createdResume.type,
        display_name: createdResume.display_name,
        description: createdResume.description,
        isOffline: false,
      })
      useCurrentResumeStore.getState().setCurrentResume(createdResume.resume_id, createdResume.type)
      get().navigate?.('/resume/editor')
      toast.success('已基于模板创建简历')
    }
    catch (createError) {
      toast.error('创建简历失败', {
        description: createError instanceof Error ? createError.message : '请稍后重试',
      })
    }
  },

  customizeOfficialTemplate: (templateId) => {
    get().openOfficialTemplateEditor(templateId)
  },

  customizeCommunityTemplate: async (templateId) => {
    const communityStore = useCommunityTemplatesStore.getState()
    const template = communityStore.findTemplate(templateId)

    if (!template) {
      toast.error('模板不存在或已被移除')
      return
    }

    communityStore.hydrateTemplateDraft(template)
    set({
      mode: 'editor',
      source: 'community',
      selectedTemplateId: templateId,
    })
  },

  toggleUserTemplatePublish: async (templateId, nextVisibility) => {
    await useUserTemplatesStore.getState().togglePublish(templateId, nextVisibility)
  },

  deleteUserTemplateRecord: async (templateId) => {
    try {
      await useUserTemplatesStore.getState().deleteTemplate(templateId)

      if (get().mode === 'editor' && get().source === 'user' && get().selectedTemplateId === templateId) {
        get().openLibrary('mine')
      }

      toast.success('模板已删除')
    }
    catch (deleteError) {
      toast.error('删除模板失败', {
        description: deleteError instanceof Error ? deleteError.message : '请稍后重试',
      })
      throw deleteError
    }
  },

  saveActiveTemplate: async () => {
    const editorState = useTemplateEditorStore.getState()
    const manifestDraft = editorState.manifestDraft

    if (!manifestDraft) {
      return
    }

    const nextManifest = updateTemplateMeta(manifestDraft, {
      visibility: editorState.publishIntent,
      status: 'active',
    })
    const validation = editorState.publishIntent === 'published'
      ? validateTemplateForPublish(nextManifest)
      : validateTemplateForSave(nextManifest)

    if (!validation.valid) {
      const [firstIssue] = validation.issues
      toast.error('模板保存失败', {
        description: firstIssue?.message ?? '请先修正模板配置',
      })
      return
    }

    editorState.markSaving(true)

    try {
      const state = get()
      const selectedOfficialTemplate = useOfficialTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const selectedCommunityTemplate = useCommunityTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const selectedUserTemplate = useUserTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const basedOnTemplateId = state.source === 'official'
        ? selectedOfficialTemplate?.id
        : state.source === 'community'
          ? selectedCommunityTemplate?.source.basedOnTemplateId ?? selectedCommunityTemplate?.id
          : selectedUserTemplate?.id

      const savedTemplate = editorState.templateId
        ? await updateUserTemplate(editorState.templateId, {
            manifest: nextManifest,
            name: nextManifest.meta.name,
            description: nextManifest.meta.description,
            visibility: editorState.publishIntent,
            status: 'active',
          })
        : await createUserTemplate({
            manifest: nextManifest,
            basedOnTemplateId,
            name: nextManifest.meta.name,
            description: nextManifest.meta.description,
            visibility: editorState.publishIntent,
            status: 'active',
          })

      const syncedTemplate = reconcileTemplateForUi(savedTemplate, {
        manifest: nextManifest,
        name: nextManifest.meta.name,
        description: nextManifest.meta.description,
        visibility: editorState.publishIntent,
        status: 'active',
      })

      editorState.markSaved({
        templateId: syncedTemplate.id,
        manifest: syncedTemplate.manifest,
        publishIntent: syncedTemplate.meta.visibility,
      })
      useUserTemplatesStore.getState().upsertAndSync(syncedTemplate)
      set({
        mode: 'editor',
        source: 'user',
        selectedTemplateId: syncedTemplate.id,
      })
      useUserTemplatesStore.getState().setLastOpenedUserTemplateId(syncedTemplate.id)
      toast.success(editorState.publishIntent === 'published' ? '模板已发布' : '模板已保存')
    }
    catch (saveError) {
      editorState.markSaving(false)
      toast.error('模板保存失败', {
        description: saveError instanceof Error ? saveError.message : '请稍后重试',
      })
    }
  },

  saveActiveTemplateAsCopy: async () => {
    const editorState = useTemplateEditorStore.getState()
    const manifestDraft = editorState.manifestDraft

    if (!manifestDraft) {
      return
    }

    const duplicatedManifest = updateTemplateMeta(manifestDraft, {
      name: `${manifestDraft.meta.name} 副本`,
      visibility: 'private',
      status: 'active',
    })
    const validation = validateTemplateForSave(duplicatedManifest)

    if (!validation.valid) {
      const [firstIssue] = validation.issues
      toast.error('另存为失败', {
        description: firstIssue?.message ?? '请先修正模板配置',
      })
      return
    }

    editorState.markSaving(true)

    try {
      const state = get()
      const selectedOfficialTemplate = useOfficialTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const selectedCommunityTemplate = useCommunityTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const selectedUserTemplate = useUserTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      const savedTemplate = await createUserTemplate({
        manifest: duplicatedManifest,
        basedOnTemplateId: editorState.templateId
          ?? selectedOfficialTemplate?.id
          ?? selectedCommunityTemplate?.source.basedOnTemplateId
          ?? selectedCommunityTemplate?.id
          ?? selectedUserTemplate?.id,
        name: duplicatedManifest.meta.name,
        description: duplicatedManifest.meta.description,
        visibility: 'private',
        status: 'active',
      })

      editorState.markSaved({
        templateId: savedTemplate.id,
        manifest: savedTemplate.manifest,
        publishIntent: savedTemplate.meta.visibility,
      })
      useUserTemplatesStore.getState().upsertAndSync(savedTemplate)
      set({
        mode: 'editor',
        source: 'user',
        selectedTemplateId: savedTemplate.id,
      })
      useUserTemplatesStore.getState().setLastOpenedUserTemplateId(savedTemplate.id)
      toast.success('已另存为新的个人模板')
    }
    catch (saveError) {
      editorState.markSaving(false)
      toast.error('另存为失败', {
        description: saveError instanceof Error ? saveError.message : '请稍后重试',
      })
    }
  },

  resetActiveTemplateDraft: () => {
    const state = get()

    if (state.source === 'official') {
      const selectedOfficialTemplate = useOfficialTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      if (selectedOfficialTemplate) {
        useOfficialTemplatesStore.getState().hydrateTemplateDraft(selectedOfficialTemplate.id)
      }
      return
    }

    if (state.source === 'community') {
      const selectedCommunityTemplate = useCommunityTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      if (selectedCommunityTemplate) {
        useCommunityTemplatesStore.getState().hydrateTemplateDraft(selectedCommunityTemplate)
      }
      return
    }

    if (state.source === 'user') {
      const selectedUserTemplate = useUserTemplatesStore.getState().findTemplate(state.selectedTemplateId)
      if (selectedUserTemplate) {
        useUserTemplatesStore.getState().hydrateTemplateDraft(selectedUserTemplate)
      }
    }
  },

}))

export default useTemplateWorkbenchStore
