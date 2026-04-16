import type { TemplateRecord } from '@/lib/resume-template/schema'
import { create } from 'zustand'
import { cloneUserTemplateRecord } from '../utils'
import useTemplateEditorStore from './editor'

interface CommunityTemplatesState {
  communityTemplates: TemplateRecord[]
  setCommunityTemplates: (templates: TemplateRecord[]) => void
  findTemplate: (templateId: string | null) => TemplateRecord | null
  hydrateTemplateDraft: (template: TemplateRecord) => void
}

const useCommunityTemplatesStore = create<CommunityTemplatesState>()((set, get) => ({
  communityTemplates: [],

  setCommunityTemplates: templates => set({ communityTemplates: templates }),

  findTemplate: (templateId) => {
    if (!templateId) {
      return null
    }

    return get().communityTemplates.find(template => template.id === templateId) ?? null
  },

  hydrateTemplateDraft: (template) => {
    const clonedTemplate = cloneUserTemplateRecord(template)

    useTemplateEditorStore.getState().hydrateDraft({
      manifest: clonedTemplate.manifest,
      publishIntent: clonedTemplate.meta.visibility,
    })
  },
}))

export default useCommunityTemplatesStore
