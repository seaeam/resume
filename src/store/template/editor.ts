import type { TemplateManifest } from '@/lib/resume-template/schema'
import { create } from 'zustand'
import { cloneTemplateManifest } from '@/lib/resume-template/defaults'

interface HydrateDraftPayload {
  templateId?: string | null
  manifest: TemplateManifest
  previewResumeId?: string | null
  publishIntent?: 'private' | 'published'
}

interface MarkSavedPayload {
  templateId?: string | null
  manifest?: TemplateManifest | null
  publishIntent?: 'private' | 'published'
}

interface TemplateEditorState {
  templateId: string | null
  manifestDraft: TemplateManifest | null
  selectedSectionId: string | null
  previewResumeId: string | null
  dirty: boolean
  saving: boolean
  publishIntent: 'private' | 'published'

  hydrateDraft: (payload: HydrateDraftPayload) => void
  setSelectedSection: (sectionId: string | null) => void
  applyManifest: (nextManifest: TemplateManifest | ((current: TemplateManifest) => TemplateManifest)) => void
  setPreviewResumeId: (resumeId: string | null) => void
  setPublishIntent: (intent: 'private' | 'published') => void
  markSaving: (saving: boolean) => void
  markSaved: (payload?: MarkSavedPayload) => void
  resetEditor: () => void
}

const INITIAL_STATE = {
  templateId: null,
  manifestDraft: null,
  selectedSectionId: null,
  previewResumeId: null,
  dirty: false,
  saving: false,
  publishIntent: 'private' as const,
}

const useTemplateEditorStore = create<TemplateEditorState>()(set => ({
  ...INITIAL_STATE,

  hydrateDraft: payload =>
    set({
      templateId: payload.templateId ?? null,
      manifestDraft: cloneTemplateManifest(payload.manifest),
      selectedSectionId: null,
      previewResumeId: payload.previewResumeId ?? null,
      dirty: false,
      saving: false,
      publishIntent: payload.publishIntent ?? payload.manifest.meta.visibility,
    }),

  setSelectedSection: sectionId => set({ selectedSectionId: sectionId }),

  applyManifest: nextManifest =>
    set((state) => {
      if (!state.manifestDraft) {
        return {}
      }

      const resolvedManifest = typeof nextManifest === 'function'
        ? nextManifest(state.manifestDraft)
        : nextManifest

      return {
        manifestDraft: cloneTemplateManifest(resolvedManifest),
        dirty: true,
        publishIntent: resolvedManifest.meta.visibility,
      }
    }),

  setPreviewResumeId: previewResumeId => set({ previewResumeId }),

  setPublishIntent: publishIntent => set({ publishIntent, dirty: true }),

  markSaving: saving => set({ saving }),

  markSaved: payload => set(state => ({
    templateId: payload?.templateId ?? state.templateId,
    manifestDraft: payload?.manifest ? cloneTemplateManifest(payload.manifest) : state.manifestDraft,
    publishIntent: payload?.publishIntent ?? state.publishIntent,
    dirty: false,
    saving: false,
  })),

  resetEditor: () => set({ ...INITIAL_STATE }),
}))

export default useTemplateEditorStore
