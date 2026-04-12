import type { NavigateFunction } from 'react-router-dom'
import type { OfficialTemplateCatalogItem } from '@/lib/resume-template/registry/official-template-catalog'
import type { TemplateRecord } from '@/lib/resume-template/schema'
import { toast } from 'sonner'
import { create } from 'zustand'
import { officialTemplateCatalog } from '@/lib/resume-template/registry/official-template-catalog'
import { createResumeFromTemplate } from '@/lib/supabase/resume/form'
import {
  createUserTemplate,
  deleteUserTemplate as deleteUserTemplateApi,
  listPublishedCommunityTemplates,
  listUserTemplates,
  updateUserTemplate,
} from '@/lib/supabase/template'
import useResumeListStore from '@/pages/resume/store'
import useCurrentResumeStore from '@/store/resume/current'
import {
  cloneUserTemplateRecord,
  createTemplateDraftFromOfficialTemplate,
  updateTemplateMeta,
  validateTemplateForPublish,
  validateTemplateForSave,
} from '../utils'
import useTemplateEditorStore from './editor'

export type TemplateWorkbenchMode = 'library' | 'editor'
export type TemplateWorkbenchSource = 'official' | 'community' | 'user' | null
export type TemplateWorkbenchTab = 'official' | 'community' | 'mine'

interface LoadTemplateOptions {
  silent?: boolean
}

interface TemplateUiPatch {
  manifest?: TemplateRecord['manifest']
  name?: string
  description?: string
  visibility?: TemplateRecord['meta']['visibility']
  status?: TemplateRecord['meta']['status']
}

interface TemplateWorkbenchState {
  activeTab: TemplateWorkbenchTab
  mode: TemplateWorkbenchMode
  source: TemplateWorkbenchSource
  selectedTemplateId: string | null
  lastOpenedUserTemplateId: string | null
  officialTemplates: OfficialTemplateCatalogItem[]
  communityTemplates: TemplateRecord[]
  userTemplates: TemplateRecord[]
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

function findOfficialTemplate(state: Pick<TemplateWorkbenchState, 'officialTemplates' | 'selectedTemplateId'>) {
  if (!state.selectedTemplateId) {
    return null
  }

  return state.officialTemplates.find(template => template.id === state.selectedTemplateId) ?? null
}

function findUserTemplate(state: Pick<TemplateWorkbenchState, 'userTemplates' | 'selectedTemplateId'>) {
  if (!state.selectedTemplateId) {
    return null
  }

  return state.userTemplates.find(template => template.id === state.selectedTemplateId) ?? null
}

function findCommunityTemplate(state: Pick<TemplateWorkbenchState, 'communityTemplates' | 'selectedTemplateId'>) {
  if (!state.selectedTemplateId) {
    return null
  }

  return state.communityTemplates.find(template => template.id === state.selectedTemplateId) ?? null
}

function findLastOpenedUserTemplate(state: Pick<TemplateWorkbenchState, 'userTemplates' | 'lastOpenedUserTemplateId'>) {
  if (!state.lastOpenedUserTemplateId) {
    return null
  }

  return state.userTemplates.find(template => template.id === state.lastOpenedUserTemplateId) ?? null
}

function reconcileLastOpenedUserTemplateId(templates: TemplateRecord[], templateId: string | null) {
  if (!templateId) {
    return null
  }

  return templates.some(template => template.id === templateId) ? templateId : null
}

function upsertTemplate(templates: TemplateRecord[], template: TemplateRecord) {
  const nextTemplates = [template, ...templates.filter(item => item.id !== template.id)]
  return nextTemplates.sort((left: TemplateRecord, right: TemplateRecord) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

function isCommunityVisibleTemplate(template: TemplateRecord) {
  return template.meta.visibility === 'published' && template.meta.status === 'active'
}

function mergeUserTemplates(remoteTemplates: TemplateRecord[], localTemplates: TemplateRecord[]) {
  const localTemplateMap = new Map(localTemplates.map(template => [template.id, template]))
  const mergedTemplates = remoteTemplates.map((template) => {
    const localTemplate = localTemplateMap.get(template.id)

    if (!localTemplate) {
      return template
    }

    return new Date(localTemplate.meta.updatedAt).getTime() > new Date(template.meta.updatedAt).getTime()
      ? localTemplate
      : template
  })

  for (const template of localTemplates) {
    if (!remoteTemplates.some(item => item.id === template.id)) {
      mergedTemplates.push(template)
    }
  }

  return mergedTemplates.sort((left, right) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

function mergeCommunityTemplates(communityTemplates: TemplateRecord[], userTemplates: TemplateRecord[]) {
  const userTemplateIds = new Set(userTemplates.map(template => template.id))
  const nextTemplates = [
    ...communityTemplates.filter(template => !userTemplateIds.has(template.id) && isCommunityVisibleTemplate(template)),
    ...userTemplates.filter(isCommunityVisibleTemplate),
  ]

  const templateMap = new Map<string, TemplateRecord>()

  for (const template of nextTemplates) {
    const currentTemplate = templateMap.get(template.id)

    if (!currentTemplate || new Date(template.meta.updatedAt).getTime() >= new Date(currentTemplate.meta.updatedAt).getTime()) {
      templateMap.set(template.id, template)
    }
  }

  return [...templateMap.values()].sort((left, right) =>
    new Date(right.meta.updatedAt).getTime() - new Date(left.meta.updatedAt).getTime(),
  )
}

function reconcileTemplateForUi(template: TemplateRecord, patch: TemplateUiPatch) {
  const nextManifest = patch.manifest ?? updateTemplateMeta(template.manifest, {
    name: patch.name ?? template.meta.name,
    description: patch.description ?? template.meta.description,
    visibility: patch.visibility ?? template.meta.visibility,
    status: patch.status ?? template.meta.status,
  })
  const updatedAt = new Date().toISOString()

  return {
    ...template,
    manifest: nextManifest,
    meta: {
      ...template.meta,
      name: patch.name ?? nextManifest.meta.name,
      description: patch.description ?? nextManifest.meta.description,
      visibility: patch.visibility ?? nextManifest.meta.visibility,
      status: patch.status ?? nextManifest.meta.status,
      updatedAt,
    },
  }
}

function hydrateOfficialTemplateDraft(templateId: string) {
  useTemplateEditorStore.getState().hydrateDraft({
    manifest: createTemplateDraftFromOfficialTemplate(templateId),
  })
}

function hydrateCommunityTemplateDraft(template: TemplateRecord) {
  const clonedTemplate = cloneUserTemplateRecord(template)

  useTemplateEditorStore.getState().hydrateDraft({
    manifest: clonedTemplate.manifest,
    publishIntent: clonedTemplate.meta.visibility,
  })
}

function hydrateUserTemplateDraft(template: TemplateRecord) {
  useTemplateEditorStore.getState().hydrateDraft({
    templateId: template.id,
    manifest: template.manifest,
    publishIntent: template.meta.visibility,
  })
}

const useTemplateWorkbenchStore = create<TemplateWorkbenchState>()((set, get) => ({
  activeTab: 'official',
  mode: 'library',
  source: null,
  selectedTemplateId: null,
  lastOpenedUserTemplateId: null,
  officialTemplates: officialTemplateCatalog,
  communityTemplates: [],
  userTemplates: [],
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

      set((state) => {
        const nextUserTemplates = mergeUserTemplates(userTemplates, state.userTemplates)

        return {
          communityTemplates: mergeCommunityTemplates(communityTemplates, nextUserTemplates),
          lastOpenedUserTemplateId: reconcileLastOpenedUserTemplateId(userTemplates, state.lastOpenedUserTemplateId),
          userTemplates: nextUserTemplates,
        }
      })
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
    const state = get()
    const lastOpenedTemplate = findLastOpenedUserTemplate(state)

    if (lastOpenedTemplate) {
      return {
        label: '继续编辑最近模板',
        onClick: () => get().openUserTemplateEditor(lastOpenedTemplate.id),
      }
    }

    if (state.userTemplates.length > 0) {
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
    hydrateOfficialTemplateDraft(templateId)
    set({
      mode: 'editor',
      source: 'official',
      selectedTemplateId: templateId,
    })
  },

  openUserTemplateEditor: (templateId) => {
    const template = get().userTemplates.find(item => item.id === templateId)

    if (!template) {
      toast.error('模板不存在或已被移除')
      return
    }

    hydrateUserTemplateDraft(template)
    set({
      mode: 'editor',
      source: 'user',
      selectedTemplateId: templateId,
      lastOpenedUserTemplateId: templateId,
    })
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
    const template = get().communityTemplates.find(item => item.id === templateId)

    if (!template) {
      toast.error('模板不存在或已被移除')
      return
    }

    hydrateCommunityTemplateDraft(template)
    set({
      mode: 'editor',
      source: 'community',
      selectedTemplateId: templateId,
    })
  },

  toggleUserTemplatePublish: async (templateId, nextVisibility) => {
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

      set((state) => {
        const nextUserTemplates = upsertTemplate(state.userTemplates, syncedTemplate)

        return {
          userTemplates: nextUserTemplates,
          communityTemplates: mergeCommunityTemplates(state.communityTemplates, nextUserTemplates),
        }
      })
      toast.success(nextVisibility === 'published' ? '模板已发布到社区' : '模板已取消发布')
    }
    catch (publishError) {
      toast.error('模板状态更新失败', {
        description: publishError instanceof Error ? publishError.message : '请稍后重试',
      })
    }
  },

  deleteUserTemplateRecord: async (templateId) => {
    try {
      await deleteUserTemplateApi(templateId)
      set((state) => {
        const nextUserTemplates = state.userTemplates.filter(template => template.id !== templateId)

        return {
          userTemplates: nextUserTemplates,
          communityTemplates: mergeCommunityTemplates(state.communityTemplates.filter(template => template.id !== templateId), nextUserTemplates),
          lastOpenedUserTemplateId: state.lastOpenedUserTemplateId === templateId ? null : state.lastOpenedUserTemplateId,
        }
      })

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
      const selectedOfficialTemplate = findOfficialTemplate(state)
      const selectedCommunityTemplate = findCommunityTemplate(state)
      const selectedUserTemplate = findUserTemplate(state)
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
      set((currentState) => {
        const nextUserTemplates = upsertTemplate(currentState.userTemplates, syncedTemplate)

        return {
          userTemplates: nextUserTemplates,
          communityTemplates: mergeCommunityTemplates(currentState.communityTemplates, nextUserTemplates),
          mode: 'editor',
          source: 'user',
          selectedTemplateId: syncedTemplate.id,
          lastOpenedUserTemplateId: syncedTemplate.id,
        }
      })
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
      const selectedOfficialTemplate = findOfficialTemplate(state)
      const selectedCommunityTemplate = findCommunityTemplate(state)
      const selectedUserTemplate = findUserTemplate(state)
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
      set((currentState) => {
        const nextUserTemplates = upsertTemplate(currentState.userTemplates, savedTemplate)

        return {
          userTemplates: nextUserTemplates,
          communityTemplates: mergeCommunityTemplates(currentState.communityTemplates, nextUserTemplates),
          mode: 'editor',
          source: 'user',
          selectedTemplateId: savedTemplate.id,
          lastOpenedUserTemplateId: savedTemplate.id,
        }
      })
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
      const selectedOfficialTemplate = findOfficialTemplate(state)
      if (selectedOfficialTemplate) {
        hydrateOfficialTemplateDraft(selectedOfficialTemplate.id)
      }
      return
    }

    if (state.source === 'community') {
      const selectedCommunityTemplate = findCommunityTemplate(state)
      if (selectedCommunityTemplate) {
        hydrateCommunityTemplateDraft(selectedCommunityTemplate)
      }
      return
    }

    if (state.source === 'user') {
      const selectedUserTemplate = findUserTemplate(state)
      if (selectedUserTemplate) {
        hydrateUserTemplateDraft(selectedUserTemplate)
      }
    }
  },

}))

export default useTemplateWorkbenchStore
