import type { DocHandle } from '@automerge/automerge-repo'
import type { StoreApi } from 'zustand'
import type { AutomergeResumeDocument } from '@/lib/automerge'
import type { ApplicationInfoFormType, BasicFormType, CampusExperienceFormType, EduBackgroundFormType, HobbiesFormType, HonorsCertificatesFormType, InternshipExperienceFormType, JobIntentFormType, ORDERType, ProjectExperienceFormType, ResumeType, SelfEvaluationFormType, SkillSpecialtyFormType, VisibilityItemsType, WorkExperienceFormType } from '@/lib/schema'
import dayjs from 'dayjs'
import { cloneDeepWith, get } from 'lodash'
import { create } from 'zustand'
import { DocumentManager } from '@/lib/automerge'
import { getOfflineResumeById, isOfflineResumeId, updateOfflineResume } from '@/lib/offline-resume-manager'
import { DEFAULT_APPLICATION_INFO, DEFAULT_BASICS, DEFAULT_CAMPUS_EXPERIENCE, DEFAULT_EDU_BACKGROUND, DEFAULT_HOBBIES, DEFAULT_HONORS_CERTIFICATES, DEFAULT_INTERNSHIP_EXPERIENCE, DEFAULT_JOB_INTENT, DEFAULT_ORDER, DEFAULT_PROJECT_EXPERIENCE, DEFAULT_SELF_EVALUATION, DEFAULT_SKILL_SPECIALTY, DEFAULT_VISIBILITY, DEFAULT_WORK_EXPERIENCE, migrateOrder, migrateVisibility, normalizeResumeType } from '@/lib/schema'
import { updateResumeConfig } from '@/lib/supabase/resume'
import { getCurrentUser } from '@/lib/supabase/user'
import { getTimestamp } from '@/utils/date'
import useCurrentResumeStore from './current'

/**
 * 表单数据 key 与默认值的映射，消除各处重复罗列所有 key 的冗余。
 * legacyKey 用于兼容旧版 camelCase 格式的文档数据。
 */
const FORM_FIELD_DEFAULTS: Record<string, { default: unknown, legacyKey?: string }> = {
  basics: { default: DEFAULT_BASICS },
  job_intent: { default: DEFAULT_JOB_INTENT, legacyKey: 'jobIntent' },
  application_info: { default: DEFAULT_APPLICATION_INFO, legacyKey: 'applicationInfo' },
  edu_background: { default: DEFAULT_EDU_BACKGROUND, legacyKey: 'eduBackground' },
  work_experience: { default: DEFAULT_WORK_EXPERIENCE, legacyKey: 'workExperience' },
  internship_experience: { default: DEFAULT_INTERNSHIP_EXPERIENCE, legacyKey: 'internshipExperience' },
  campus_experience: { default: DEFAULT_CAMPUS_EXPERIENCE, legacyKey: 'campusExperience' },
  project_experience: { default: DEFAULT_PROJECT_EXPERIENCE, legacyKey: 'projectExperience' },
  skill_specialty: { default: DEFAULT_SKILL_SPECIALTY, legacyKey: 'skillSpecialty' },
  honors_certificates: { default: DEFAULT_HONORS_CERTIFICATES, legacyKey: 'honorsCertificates' },
  self_evaluation: { default: DEFAULT_SELF_EVALUATION, legacyKey: 'selfEvaluation' },
  hobbies: { default: DEFAULT_HOBBIES },
}

const FORM_DATA_KEYS = Object.keys(FORM_FIELD_DEFAULTS) as (keyof FormDataMap)[]

// 表单数据映射
interface FormDataMap {
  basics: BasicFormType
  job_intent: JobIntentFormType
  application_info: ApplicationInfoFormType
  edu_background: EduBackgroundFormType
  work_experience: WorkExperienceFormType
  internship_experience: InternshipExperienceFormType
  campus_experience: CampusExperienceFormType
  project_experience: ProjectExperienceFormType
  skill_specialty: SkillSpecialtyFormType
  honors_certificates: HonorsCertificatesFormType
  self_evaluation: SelfEvaluationFormType
  hobbies: HobbiesFormType
}

type EditorMode = 'online' | 'offline' | null

interface ResumeState extends FormDataMap {
  activeTabId: ORDERType
  order: ORDERType[]
  visibility: Record<VisibilityItemsType, boolean>
  type: ResumeType

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
  changeType: (type: ResumeType) => void
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
let onlineSyncTimer: ReturnType<typeof setTimeout> | null = null
const SYNC_DELAY = 3000
const ONLINE_SYNC_DELAY = 3000

function scheduleOfflinePersist(flushFn: () => Promise<void>) {
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(() => {
    void flushFn()
  }, SYNC_DELAY)
}

function scheduleOnlinePersist(flushFn: () => Promise<void>) {
  if (onlineSyncTimer) {
    clearTimeout(onlineSyncTimer)
  }
  onlineSyncTimer = setTimeout(() => {
    void flushFn()
  }, ONLINE_SYNC_DELAY)
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

  // set() 之后重新读取最新状态，避免使用过期快照
  const freshState = get()
  const resumeId = freshState.currentResumeId ?? useCurrentResumeStore.getState().resumeId

  // 2. 离线模式：触发延时保存
  if (!resumeId || freshState.mode === 'offline' || isOfflineResumeId(resumeId)) {
    scheduleOfflinePersist(() => get().syncToSupabase())
    return
  }

  // 3. 在线模式：更新 Automerge 文档
  if (docUpdate) {
    try {
      freshState.docManager?.change((doc) => {
        docUpdate(doc)
      })
    }
    catch (error) {
      console.error('Document update failed:', error)
      set({ syncError: '文档同步失败，请刷新重试' })
    }
  }

  // 4. 在线模式：调度延时自动保存
  scheduleOnlinePersist(() => get().syncToSupabase())
}

const useResumeStore = create<ResumeState>()((set, get) => ({
  basics: DEFAULT_BASICS,
  job_intent: DEFAULT_JOB_INTENT,
  order: DEFAULT_ORDER,
  activeTabId: 'basics',
  application_info: DEFAULT_APPLICATION_INFO,
  edu_background: DEFAULT_EDU_BACKGROUND,
  work_experience: DEFAULT_WORK_EXPERIENCE,
  internship_experience: DEFAULT_INTERNSHIP_EXPERIENCE,
  campus_experience: DEFAULT_CAMPUS_EXPERIENCE,
  project_experience: DEFAULT_PROJECT_EXPERIENCE,
  skill_specialty: DEFAULT_SKILL_SPECIALTY,
  honors_certificates: DEFAULT_HONORS_CERTIFICATES,
  self_evaluation: DEFAULT_SELF_EVALUATION,
  hobbies: DEFAULT_HOBBIES,
  visibility: DEFAULT_VISIBILITY,
  type: 'default',

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

  getResumeFormData: () => {
    const state = get()
    return FORM_DATA_KEYS.reduce((acc, key) => {
      (acc as any)[key] = state[key]
      return acc
    }, {} as FormDataMap)
  },

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
        await updateOfflineResume(resumeId, getFormPayload(state))
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
      set({ isSyncing: false })
      return
    }

    set({ isSyncing: true })
    try {
      await state.docManager.saveToSupabase(state.docHandle)
      // 使用 Automerge 文档冲突解决后的最终内容同步到 resume_config
      const resolvedDoc = state.docHandle?.doc()
      if (resolvedDoc) {
        const resolvedFormData = mapDocToState(resolvedDoc)
        await updateResumeConfig(resumeId, resolvedFormData)
      }
      else {
        // 降级：如果无法获取 Automerge 文档，使用本地状态
        await updateResumeConfig(resumeId, get().getResumeFormData())
      }
      set({
        isSyncing: false,
        pendingChanges: false,
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
  },

  manualSync: async () => {
    if (syncTimer) {
      clearTimeout(syncTimer)
      syncTimer = null
    }
    if (onlineSyncTimer) {
      clearTimeout(onlineSyncTimer)
      onlineSyncTimer = null
    }
    await get().syncToSupabase()
  },

  loadResumeData: async (resumeId: string, options?: { documentUrl?: string }) => {
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
      const manager = new DocumentManager(resumeId, user.id, {
        sharedDocumentUrl: options?.documentUrl,
      })
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
      ...Object.fromEntries(
        FORM_DATA_KEYS.map(key => [key, FORM_FIELD_DEFAULTS[key].default]),
      ),
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
    if (onlineSyncTimer) {
      clearTimeout(onlineSyncTimer)
      onlineSyncTimer = null
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

/** 深拷贝并过滤掉所有值为 undefined 的属性 */
function sanitizeDeep<T>(value: T): T {
  return cloneDeepWith(value, (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val).filter(([, v]) => v !== undefined),
      )
    }
  }) as T
}

function applyPatch(target: Record<string, any>, patch: Record<string, unknown>) {
  for (const [field, value] of Object.entries(patch)) {
    if (value !== undefined) {
      target[field] = value
    }
  }
}

/**
 * 将 Automerge 文档（或空值）映射为 Zustand store 状态。
 *
 * 数据库中可能存在 camelCase（旧格式）或 snake_case（新格式）的 key，
 * 需要按优先级 snake_case > camelCase > 默认值 依次回退。
 */
function mapDocToState(doc: Partial<AutomergeResumeDocument> | null | undefined) {
  const source = doc as Record<string, any> | undefined

  const formData = Object.fromEntries(
    FORM_DATA_KEYS.map((key) => {
      const { default: defaultVal, legacyKey } = FORM_FIELD_DEFAULTS[key]
      const val = get(source, key)
        ?? (legacyKey ? get(source, legacyKey) : undefined)
        ?? defaultVal
      return [key, sanitizeDeep(val)]
    }),
  )

  return {
    ...formData,
    order: migrateOrder(sanitizeDeep(get(source, 'order', DEFAULT_ORDER))),
    visibility: migrateVisibility(sanitizeDeep(get(source, 'visibility', DEFAULT_VISIBILITY))),
    type: normalizeResumeType(get(source, 'type', 'default')),
  }
}

/**
 * 从 state 中提取所有表单数据 + order/visibility/type 作为持久化载荷。
 * 同时服务于离线保存和在线同步。
 */
function getFormPayload(state: ResumeState) {
  return {
    ...Object.fromEntries(
      FORM_DATA_KEYS.map(key => [key, state[key]]),
    ),
    order: state.order,
    visibility: state.visibility,
    type: state.type,
  }
}

export default useResumeStore
