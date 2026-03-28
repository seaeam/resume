import type { DocHandle } from '@automerge/automerge-repo'
import type { StoreApi } from 'zustand'
import type { FormDataMap } from './const'
import type { AutomergeResumeDocument } from '@/lib/automerge'
import type { ORDERType, PersistedResumeSnapshot, ResumeAppearancePatch, ResumeType, VisibilityItemsType } from '@/lib/schema'
import type { ResumeSnapshot } from '@/lib/supabase/resume/history'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { DocumentManager } from '@/lib/automerge'
import { getOfflineResumeById, isOfflineResumeId, updateOfflineResume } from '@/lib/offline-resume-manager'
import { DEFAULT_APPLICATION_INFO, DEFAULT_BASICS, DEFAULT_CAMPUS_EXPERIENCE, DEFAULT_EDU_BACKGROUND, DEFAULT_HOBBIES, DEFAULT_HONORS_CERTIFICATES, DEFAULT_INTERNSHIP_EXPERIENCE, DEFAULT_JOB_INTENT, DEFAULT_ORDER, DEFAULT_PROJECT_EXPERIENCE, DEFAULT_SELF_EVALUATION, DEFAULT_SKILL_SPECIALTY, DEFAULT_VISIBILITY, DEFAULT_WORK_EXPERIENCE } from '@/lib/schema'
import { updateResumeConfig } from '@/lib/supabase/resume'
import { getResumeById } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import { getTimestamp } from '@/utils/date'
import useResumeConfigStore, { registerResumeConfigPersistence } from './config'
import { FORM_DATA_KEYS, FORM_FIELD_DEFAULTS, ONLINE_SYNC_DELAY, SYNC_DELAY } from './const'
import useCurrentResumeStore from './current'
import { applyPatch, getFormPayload, hasPersistedAppearance, mapSnapshotToState, mapSourceToPersistedSnapshot, mergeSnapshotAppearance, sanitizeDeep } from './utils'

type EditorMode = 'online' | 'offline' | null
interface ResumeLoadResult {
  snapshot: PersistedResumeSnapshot
  hasPersistedAppearance: boolean
  cloudAppearanceStatus: 'present' | 'missing' | 'error' | 'not_applicable'
  mode: Exclude<EditorMode, null>
}

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
  cloudAppearanceStatus: ResumeLoadResult['cloudAppearanceStatus']
  docHasPersistedAppearance: boolean
  appearanceDirty: boolean

  toggleVisibility: (id: VisibilityItemsType) => void
  changeType: (type: ResumeType) => void
  getVisibility: (id: VisibilityItemsType) => boolean
  setVisibility: (id: VisibilityItemsType, isHidden: boolean) => void
  updateActiveTabId: (newActiveTab: ORDERType) => void
  getResumeFormData: () => FormDataMap
  getPersistedSnapshot: () => PersistedResumeSnapshot
  getHistoryRestoreSource: () => { snapshot: ResumeSnapshot, updatedAt: string | null }
  updateForm: <K extends keyof FormDataMap>(key: K, data: Partial<FormDataMap[K]>) => void
  updateOrder: (newOrder: ORDERType[]) => void
  updateAppearanceConfig: (appearance: ResumeAppearancePatch) => void

  syncToSupabase: () => Promise<void>
  manualSync: () => Promise<void>
  loadResumeData: (resumeId: string, options?: { documentUrl?: string }) => Promise<ResumeLoadResult>
  resetToDefaults: () => void
  cleanup: () => void
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
let onlineSyncTimer: ReturnType<typeof setTimeout> | null = null

function scheduleOfflinePersist(flushFn: () => Promise<void>) {
  if (syncTimer) {
    clearTimeout(syncTimer)
  }
  syncTimer = setTimeout(() => {
    flushFn()
  }, SYNC_DELAY)
}

function scheduleOnlinePersist(flushFn: () => Promise<void>) {
  if (onlineSyncTimer) {
    clearTimeout(onlineSyncTimer)
  }
  onlineSyncTimer = setTimeout(() => {
    flushFn()
  }, ONLINE_SYNC_DELAY)
}

function ensureSection<T extends keyof AutomergeResumeDocument>(doc: AutomergeResumeDocument, key: T) {
  if (!doc[key]) {
    doc[key] = ({} as AutomergeResumeDocument[T])
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
  cloudAppearanceStatus: 'not_applicable',
  docHasPersistedAppearance: false,
  appearanceDirty: false,

  getResumeFormData: () => {
    const state = get()
    return FORM_DATA_KEYS.reduce((acc, key) => {
      (acc[key] as any) = state[key]
      return acc
    }, {} as FormDataMap)
  },

  getPersistedSnapshot: () => getPersistedSnapshot(get()),

  getHistoryRestoreSource: () => {
    const state = get()
    return {
      snapshot: sanitizeDeep(getPersistedSnapshot(state)),
      updatedAt: state.docHandle?.doc()?._metadata?.updatedAt ?? null,
    }
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

  updateAppearanceConfig: (appearance) => {
    const sanitized = sanitizeDeep(appearance)
    if (Object.keys(sanitized).length === 0) {
      return
    }

    applyResumeChange(
      set,
      get,
      { appearanceDirty: true },
      (doc) => {
        if (sanitized.spacing) {
          doc.spacing = { ...(doc.spacing ?? {}), ...sanitized.spacing }
        }
        if (sanitized.font) {
          doc.font = { ...(doc.font ?? {}), ...sanitized.font }
        }
        if (sanitized.theme) {
          doc.theme = { ...(doc.theme ?? {}), ...sanitized.theme }
        }
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
        await updateOfflineResume(resumeId, getPersistedSnapshot(state))
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
        await updateResumeConfig(resumeId, buildResumeConfigPayload(state, resolvedDoc))
      }
      else {
        // 降级：如果无法获取 Automerge 文档，使用本地状态
        await updateResumeConfig(resumeId, buildResumeConfigPayload(state))
      }
      set({
        isSyncing: false,
        pendingChanges: false,
        syncError: null,
        lastSyncTime: getTimestamp(),
        appearanceDirty: false,
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
      const snapshot = mapSourceToPersistedSnapshot(data as Partial<AutomergeResumeDocument>)

      set({
        ...mapSnapshotToState(snapshot),
        isSyncing: false,
        pendingChanges: false,
        syncError: null,
        mode: 'offline',
        isInitialized: true,
        lastSyncTime: offlineResume.updated_at ? dayjs(offlineResume.updated_at).valueOf() : null,
        cloudAppearanceStatus: 'not_applicable',
        docHasPersistedAppearance: hasPersistedAppearance(data),
        appearanceDirty: false,
      })
      return {
        snapshot,
        hasPersistedAppearance: hasPersistedAppearance(data),
        cloudAppearanceStatus: 'not_applicable',
        mode: 'offline',
      }
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
      const docSnapshot = mapSourceToPersistedSnapshot(doc)
      const cloudAppearanceResult = await getCloudAppearanceSource(resumeId)
      const cloudHasPersistedAppearance = cloudAppearanceResult.status === 'present'
      const docHasPersistedAppearance = hasPersistedAppearance(doc)
      const snapshot = cloudHasPersistedAppearance
        ? mergeSnapshotAppearance(docSnapshot, cloudAppearanceResult.appearance)
        : docSnapshot

      const changeHandler = ({ doc }: { doc: AutomergeResumeDocument | null }) => {
        if (!doc)
          return

        set(prev => ({
          ...prev,
          ...mapSnapshotToState(mapSourceToPersistedSnapshot(doc)),
          isInitialized: true,
        }))
      }

      handle.on('change', changeHandler)
      const offChange = () => handle.off('change', changeHandler)

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
        ...mapSnapshotToState(snapshot),
        docManager: manager,
        docHandle: handle,
        cleanupFns: [offChange, offSaveStart, offSave],
        isSyncing: false,
        pendingChanges: false,
        syncError: null,
        mode: 'online',
        isInitialized: true,
        cloudAppearanceStatus: cloudAppearanceResult.status,
        docHasPersistedAppearance,
        appearanceDirty: false,
      })
      return {
        snapshot,
        hasPersistedAppearance: cloudHasPersistedAppearance || docHasPersistedAppearance,
        cloudAppearanceStatus: cloudAppearanceResult.status,
        mode: 'online',
      }
    }
    catch (error) {
      set({
        isSyncing: false,
        syncError: error instanceof Error ? error.message : '初始化失败',
        mode: 'online',
        cloudAppearanceStatus: 'error',
      })
      throw error
    }
  },

  resetToDefaults: () => {
    useResumeConfigStore.getState().resetConfig()
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
        Object.assign(doc, mapSourceToPersistedSnapshot(null))
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
      cloudAppearanceStatus: 'not_applicable',
      docHasPersistedAppearance: false,
      appearanceDirty: false,
    })
  },
}))

async function getCloudAppearanceSource(resumeId: string): Promise<{
  status: 'present' | 'missing' | 'error'
  appearance: ResumeAppearancePatch | null
}> {
  try {
    const appearance = await getResumeById(resumeId, 'spacing,font,theme')
    return {
      status: hasPersistedAppearance(appearance) ? 'present' : 'missing',
      appearance,
    }
  }
  catch (error) {
    console.warn('Failed to read cloud appearance snapshot:', error)
    return {
      status: 'error',
      appearance: null,
    }
  }
}

function getPersistedSnapshot(state: ResumeState): PersistedResumeSnapshot {
  const { spacing, font, theme } = useResumeConfigStore.getState()
  return {
    ...getFormPayload(state),
    spacing,
    font,
    theme,
  }
}

function shouldPersistAppearance(state: ResumeState, source: Partial<AutomergeResumeDocument> | null | undefined) {
  return hasPersistedAppearance(source)
    || state.docHasPersistedAppearance
    || state.appearanceDirty
    || state.cloudAppearanceStatus === 'present'
    || state.cloudAppearanceStatus === 'missing'
}

function buildResumeConfigPayload(
  state: ResumeState,
  source?: Partial<AutomergeResumeDocument> | null,
) {
  const baseSnapshot = source
    ? mapSourceToPersistedSnapshot(source)
    : getPersistedSnapshot(state)

  if (shouldPersistAppearance(state, source)) {
    return mergeSnapshotAppearance(baseSnapshot, useResumeConfigStore.getState())
  }

  const { spacing, font, theme, ...payload } = baseSnapshot
  return payload
}

registerResumeConfigPersistence(appearance => useResumeStore.getState().updateAppearanceConfig(appearance))

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    useResumeStore.getState().cleanup()
  })
}

export default useResumeStore
