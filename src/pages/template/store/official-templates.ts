import type { OfficialTemplateCatalogItem } from '@/lib/resume-template/registry/official-template-catalog'
import { create } from 'zustand'
import { officialTemplateCatalog } from '@/lib/resume-template/registry/official-template-catalog'
import { createTemplateDraftFromOfficialTemplate } from '../utils'
import useTemplateEditorStore from './editor'

interface OfficialTemplatesState {
  officialTemplates: OfficialTemplateCatalogItem[]
  findTemplate: (templateId: string | null) => OfficialTemplateCatalogItem | null
  hydrateTemplateDraft: (templateId: string) => void
}

const useOfficialTemplatesStore = create<OfficialTemplatesState>()((_, get) => ({
  officialTemplates: officialTemplateCatalog,

  findTemplate: (templateId) => {
    if (!templateId) {
      return null
    }

    return get().officialTemplates.find(template => template.id === templateId) ?? null
  },

  hydrateTemplateDraft: (templateId) => {
    useTemplateEditorStore.getState().hydrateDraft({
      manifest: createTemplateDraftFromOfficialTemplate(templateId),
    })
  },
}))

export default useOfficialTemplatesStore
