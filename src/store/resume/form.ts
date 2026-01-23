import type { DocHandle } from '@automerge/automerge-repo'
import type { StoreApi } from 'zustand'
import type { AutomergeResumeDocument } from '@/lib/automerge/schema'
import type { ApplicationInfoFormType, BasicFormType, CampusExperienceFormType, EduBackgroundFormType, HobbiesFormType, HonorsCertificatesFormType, InternshipExperienceFormType, JobIntentFormType, ORDERType, ProjectExperienceFormType, SelfEvaluationFormType, SkillSpecialtyFormType, VisibilityItemsType, WorkExperienceFormType } from '@/lib/schema'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { DocumentManager } from '@/lib/automerge/document-manager'
import { getOfflineResumeById, isOfflineResumeId, updateOfflineResume } from '@/lib/offline-resume-manager'
import { DEFAULT_APPLICATION_INFO, DEFAULT_BASICS, DEFAULT_CAMPUS_EXPERIENCE, DEFAULT_EDU_BACKGROUND, DEFAULT_HOBBIES, DEFAULT_HONORS_CERTIFICATES, DEFAULT_INTERNSHIP_EXPERIENCE, DEFAULT_JOB_INTENT, DEFAULT_ORDER, DEFAULT_PROJECT_EXPERIENCE, DEFAULT_SELF_EVALUATION, DEFAULT_SKILL_SPECIALTY, DEFAULT_VISIBILITY, DEFAULT_WORK_EXPERIENCE } from '@/lib/schema'
import { updateResumeConfig } from '@/lib/supabase/resume'
import { getCurrentUser } from '@/lib/supabase/user'
import { getTimestamp } from '@/utils/date'
import useCurrentResumeStore from './current'

// 表单数据映射
interface FormDataMap {
  basics: BasicFormType
  jobIntent: JobIntentFormType
  applicationInfo: ApplicationInfoFormType
  eduBackground: EduBackgroundFormType
  workExperience: WorkExperienceFormType
  internshipExperience: InternshipExperienceFormType
  campusExperience: CampusExperienceFormType
  projectExperience: ProjectExperienceFormType
  skillSpecialty: SkillSpecialtyFormType
  honorsCertificates: HonorsCertificatesFormType
  selfEvaluation: SelfEvaluationFormType
  hobbies: HobbiesFormType
}

type EditorMode = 'online' | 'offline' | null

interface ResumeState extends FormDataMap {
  activeTabId: ORDERType
  order: ORDERType[]
  visibility: Record<VisibilityItemsType, boolean>
  type: 'basic' | 'modern' | 'simple'

  isSyncing: boolean
  lastSyncTime: number | null
  syncError: string | null
  pendingChanges: boolean

  mode: EditorMode
  currentResumeId: string | null
  docManager: DocumentManager | null
  docHandle: DocHandle<AutomergeResumeDocument> | null
  cleanupFns: Array<() => void>
  isInitialized: boolean

  toggleVisibility: (id: VisibilityItemsType) => void
  changeType: (type: 'basic' | 'modern' | 'simple') => void
  getVisibility: (id: VisibilityItemsType) => boolean
  setVisibility: (id: VisibilityItemsType, isHidden: boolean) => void
  updateActiveTabId: (newActiveTab: ORDERType) => void
  getResumeFormData: () => FormDataMap
  updateForm: <K extends keyof FormDataMap>(key: K, data: Partial<FormDataMap[K]>) => void
  updateOrder: (newOrder: ORDERType[]) => void

  syncToSupabase: () => Promise<void>
  manualSync: () => Promise<void>
  loadResumeData: (resumeId: string, options?: { documentUrl?: string }) => Promise<void>
  resetToDefaults: () => void
  cleanup: () => void
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
const SYNC_DELAY = 3000

function scheduleOfflinePersist(flushFn: () => Promise<void>) {
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(() => {
    void flushFn()
  }, SYNC_DELAY)
}

function ensureSection<T extends keyof AutomergeResumeDocument>(doc: AutomergeResumeDocument, key: T) {
  if (!doc[key]) {
    (doc as any)[key] = ({} as any)
  }
}

function applyResumeChange(
  set: StoreApi<ResumeState>['setState'],
  get: StoreApi<ResumeState>['getState'],
  stateUpdate: ((prev: ResumeState) => Partial<ResumeState>) | Partial<ResumeState>,
  docUpdate?: (doc: AutomergeResumeDocument) => void,
) {
  const state = get()
  const resumeId = state.currentResumeId ?? useCurrentResumeStore.getState().resumeId

  // 1. 应用本地状态更新 (Optimistic UI)
  set((prev: ResumeState) => {
    try {
      const updates = typeof stateUpdate === 'function'
        ? stateUpdate(prev)
        : stateUpdate
      return { ...updates, pendingChanges: true, syncError: null }
    }
    catch (error) {
      console.error('State update failed:', error)
      return { syncError: '状态更新失败' }
    }
  })

  // 2. 离线模式：触发延时保存
  if (!resumeId || state.mode === 'offline' || isOfflineResumeId(resumeId)) {
    scheduleOfflinePersist(() => get().syncToSupabase())
    return
  }

  // 3. 在线模式：更新 Automerge 文档
  // 可以在此处统一添加节流、审计日志或更复杂的错误恢复策略
  if (docUpdate) {
    try {
      state.docManager?.change((doc) => {
        docUpdate(doc)
      })
    }
    catch (error) {
      console.error('Document update failed:', error)
      set({ syncError: '文档同步失败，请刷新重试' })
      // TODO: 考虑是否需要回滚本地状态或重新初始化文档
    }
  }
}

const useResumeStore = create<ResumeState>()((set, get) => ({
  basics: DEFAULT_BASICS,
  jobIntent: DEFAULT_JOB_INTENT,
  order: DEFAULT_ORDER,
  activeTabId: 'basics',
  applicationInfo: DEFAULT_APPLICATION_INFO,
  eduBackground: DEFAULT_EDU_BACKGROUND,
  workExperience: DEFAULT_WORK_EXPERIENCE,
  internshipExperience: DEFAULT_INTERNSHIP_EXPERIENCE,
  campusExperience: DEFAULT_CAMPUS_EXPERIENCE,
  projectExperience: DEFAULT_PROJECT_EXPERIENCE,
  skillSpecialty: DEFAULT_SKILL_SPECIALTY,
  honorsCertificates: DEFAULT_HONORS_CERTIFICATES,
  selfEvaluation: DEFAULT_SELF_EVALUATION,
  hobbies: DEFAULT_HOBBIES,
  visibility: DEFAULT_VISIBILITY,
  type: 'basic',

  isSyncing: false,
  lastSyncTime: null,
  syncError: null,
  pendingChanges: false,

  mode: null,
  currentResumeId: null,
  docManager: null,
  docHandle: null,
  cleanupFns: [],
  isInitialized: false,

  getResumeFormData: () => ({
    basics: get().basics,
    jobIntent: get().jobIntent,
    applicationInfo: get().applicationInfo,
    eduBackground: get().eduBackground,
    workExperience: get().workExperience,
    internshipExperience: get().internshipExperience,
    campusExperience: get().campusExperience,
    projectExperience: get().projectExperience,
    skillSpecialty: get().skillSpecialty,
    honorsCertificates: get().honorsCertificates,
    selfEvaluation: get().selfEvaluation,
    hobbies: get().hobbies,
  }),

  updateActiveTabId: newActiveTab => set({ activeTabId: newActiveTab }),

  updateForm: (key, data) => {
    const sanitized = sanitizeDeep(data)
    applyResumeChange(
      set,
      get,
      prev => ({ [key]: { ...prev[key], ...sanitized } }),
      (doc) => {
        ensureSection(doc, key)
        applyPatch(doc[key], sanitized)
      },
    )
  },

  updateOrder: (newOrder) => {
    applyResumeChange(
      set,
      get,
      { order: newOrder },
      (doc) => {
        doc.order = [...newOrder]
      },
    )
  },

  changeType: (type) => {
    applyResumeChange(
      set,
      get,
      { type },
      (doc) => {
        doc.type = type
      },
    )
  },

  toggleVisibility: (id) => {
    const nextValue = !get().visibility[id]
    applyResumeChange(
      set,
      get,
      prev => ({ visibility: { ...prev.visibility, [id]: nextValue } }),
      (doc) => {
        ensureSection(doc, 'visibility')
        doc.visibility[id] = nextValue
      },
    )
  },

  getVisibility: id => get().visibility[id],

  setVisibility: (id, isHidden) => {
    applyResumeChange(
      set,
      get,
      prev => ({ visibility: { ...prev.visibility, [id]: isHidden } }),
      (doc) => {
        ensureSection(doc, 'visibility')
        doc.visibility[id] = isHidden
      },
    )
  },

  syncToSupabase: async () => {
    const state = get()
    const resumeId = state.currentResumeId ?? useCurrentResumeStore.getState().resumeId

    if (!resumeId) {
      return
    }

    set({ isSyncing: true })

    if (state.mode === 'offline' || isOfflineResumeId(resumeId)) {
      try {
        await updateOfflineResume(resumeId, buildOfflinePayload(state))
        set({
          pendingChanges: false,
          isSyncing: false,
          syncError: null,
          lastSyncTime: getTimestamp(),
        })
      }
      catch (error) {
        set({
          isSyncing: false,
          syncError: error instanceof Error ? error.message : '同步失败',
        })
      }
      return
    }

    if (!state.docManager || !state.docHandle) {
      return
    }

    set({ isSyncing: true })
    try {
      await state.docManager.saveToSupabase(state.docHandle)
      await updateResumeConfig(resumeId, get().getResumeFormData())
    }
    catch (error) {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : '同步失败',
      })
    }
  },

  manualSync: async () => {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    await get().syncToSupabase()
  },

  loadResumeData: async (resumeId: string) => {
    const { docManager, cleanupFns } = get()

    if (cleanupFns.length > 0) {
      cleanupFns.forEach(fn => fn())
    }
    if (docManager) {
      docManager.destroy()
    }

    set({
      isSyncing: true,
      syncError: null,
      pendingChanges: false,
      docManager: null,
      docHandle: null,
      cleanupFns: [],
      currentResumeId: resumeId,
      mode: isOfflineResumeId(resumeId) ? 'offline' : 'online',
      isInitialized: false,
    })

    if (isOfflineResumeId(resumeId)) {
      const offlineResume = await getOfflineResumeById(resumeId)
      if (!offlineResume) {
        throw new Error('离线简历不存在')
      }

      const data = offlineResume.data || {}

      set({
        ...mapDocToState(data as Partial<AutomergeResumeDocument>),
        isSyncing: false,
        pendingChanges: false,
        syncError: null,
        mode: 'offline',
        isInitialized: true,
        lastSyncTime: offlineResume.updated_at ? dayjs(offlineResume.updated_at).valueOf() : null,
      })
      return
    }

    const user = await getCurrentUser()
    if (!user) {
      throw new Error('用户未登录')
    }

    try {
      const manager = new DocumentManager(resumeId, user.id)
      const handle = await manager.initialize()
      const doc = handle.doc()

      const changeHandler = ({ doc }: { doc: AutomergeResumeDocument | null }) => {
        if (!doc)
          return

        set(prev => ({
          ...prev,
          ...mapDocToState(doc),
          isInitialized: true,
        }))
      }

      handle.on('change', changeHandler as any)
      const offChange = () => handle.off('change', changeHandler as any)

      const offSaveStart = manager.onSaveStart(() => {
        set({ isSyncing: true })
      })

      const offSave = manager.onSaveResult(({ success, error }) => {
        if (success) {
          set({
            isSyncing: false,
            pendingChanges: false,
            syncError: null,
            lastSyncTime: getTimestamp(),
          })
        }
        else {
          set({
            isSyncing: false,
            syncError: error instanceof Error ? error.message : '同步失败',
          })
        }
      })

      set({
        ...mapDocToState(doc),
        docManager: manager,
        docHandle: handle,
        cleanupFns: [offChange, offSaveStart, offSave],
        isSyncing: false,
        pendingChanges: false,
        syncError: null,
        mode: 'online',
        isInitialized: true,
      })
    }
    catch (error) {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : '初始化失败',
        mode: 'online',
      })
      throw error
    }
  },

  resetToDefaults: () => {
    const defaultState = {
      basics: DEFAULT_BASICS,
      jobIntent: DEFAULT_JOB_INTENT,
      applicationInfo: DEFAULT_APPLICATION_INFO,
      eduBackground: DEFAULT_EDU_BACKGROUND,
      workExperience: DEFAULT_WORK_EXPERIENCE,
      internshipExperience: DEFAULT_INTERNSHIP_EXPERIENCE,
      campusExperience: DEFAULT_CAMPUS_EXPERIENCE,
      projectExperience: DEFAULT_PROJECT_EXPERIENCE,
      skillSpecialty: DEFAULT_SKILL_SPECIALTY,
      honorsCertificates: DEFAULT_HONORS_CERTIFICATES,
      selfEvaluation: DEFAULT_SELF_EVALUATION,
      hobbies: DEFAULT_HOBBIES,
      order: DEFAULT_ORDER,
      visibility: DEFAULT_VISIBILITY,
    }

    applyResumeChange(
      set,
      get,
      defaultState,
      (doc) => {
        Object.assign(doc, mapDocToState(null))
      },
    )
  },

  cleanup: () => {
    const { cleanupFns, docManager } = get()
    cleanupFns.forEach(fn => fn())
    docManager?.destroy()
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    set({
      cleanupFns: [],
      docManager: null,
      docHandle: null,
      mode: null,
      currentResumeId: null,
      isInitialized: false,
    })
  },
}))

function sanitizeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeDeep(item)) as T
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
      if (val === undefined)
        return
      result[key] = sanitizeDeep(val)
    })
    return result as T
  }
  return value
}

function applyPatch(target: Record<string, any>, patch: Partial<Record<string, any>>) {
  Object.entries(patch).forEach(([field, value]) => {
    if (value === undefined)
      return
    target[field] = value
  })
}

function mapDocToState(doc: Partial<AutomergeResumeDocument> | null | undefined) {
  const source = doc as Record<string, any> | undefined

  const getVal = <T>(key: string, defaultVal: T, legacyKey?: string) => {
    const val = source?.[key] ?? (legacyKey ? source?.[legacyKey] : undefined) ?? defaultVal
    return sanitizeDeep(val as T)
  }

  return {
    basics: getVal('basics', DEFAULT_BASICS),
    jobIntent: getVal('jobIntent', DEFAULT_JOB_INTENT, 'job_intent'),
    applicationInfo: getVal('applicationInfo', DEFAULT_APPLICATION_INFO, 'application_info'),
    eduBackground: getVal('eduBackground', DEFAULT_EDU_BACKGROUND, 'edu_background'),
    workExperience: getVal('workExperience', DEFAULT_WORK_EXPERIENCE, 'work_experience'),
    internshipExperience: getVal('internshipExperience', DEFAULT_INTERNSHIP_EXPERIENCE, 'internship_experience'),
    campusExperience: getVal('campusExperience', DEFAULT_CAMPUS_EXPERIENCE, 'campus_experience'),
    projectExperience: getVal('projectExperience', DEFAULT_PROJECT_EXPERIENCE, 'project_experience'),
    skillSpecialty: getVal('skillSpecialty', DEFAULT_SKILL_SPECIALTY, 'skill_specialty'),
    honorsCertificates: getVal('honorsCertificates', DEFAULT_HONORS_CERTIFICATES, 'honors_certificates'),
    selfEvaluation: getVal('selfEvaluation', DEFAULT_SELF_EVALUATION, 'self_evaluation'),
    hobbies: getVal('hobbies', DEFAULT_HOBBIES),
    order: getVal('order', DEFAULT_ORDER),
    visibility: getVal('visibility', DEFAULT_VISIBILITY),
    type: source?.type || 'basic',
  }
}

function buildOfflinePayload(state: ResumeState) {
  return {
    basics: state.basics,
    jobIntent: state.jobIntent,
    applicationInfo: state.applicationInfo,
    eduBackground: state.eduBackground,
    workExperience: state.workExperience,
    internshipExperience: state.internshipExperience,
    campusExperience: state.campusExperience,
    projectExperience: state.projectExperience,
    skillSpecialty: state.skillSpecialty,
    honorsCertificates: state.honorsCertificates,
    selfEvaluation: state.selfEvaluation,
    hobbies: state.hobbies,
    order: state.order,
    visibility: state.visibility,
    type: state.type,
  }
}

export default useResumeStore
