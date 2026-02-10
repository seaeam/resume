import type { DiffResult, HistoryEntry, MilestoneInfo, ResumeInfo } from './types'
import { toast } from 'sonner'
import { create } from 'zustand'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import { migrateOrder, migrateVisibility } from '@/lib/schema'
import { getAllResumesFromUser } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'
import { MERGE_INTERVAL_MS } from './const'
import { buildSnapshot, computeDiff } from './utils'

interface HistoryState {
  // 简历列表
  resumeList: ResumeInfo[]
  loadingResumes: boolean

  // 当前选中简历
  selectedResumeId: string | null
  selectedResumeName: string
  isSelectedOffline: boolean

  // 历史数据
  historyList: HistoryEntry[]
  allChanges: Uint8Array[]
  loading: boolean

  // 里程碑
  milestones: Map<string, MilestoneInfo>

  // UI 状态
  previewEntry: HistoryEntry | null
  previewData: Record<string, unknown> | null
  restoreEntry: HistoryEntry | null
  restoring: boolean
  diffSourceEntry: HistoryEntry | null
  diffTargetEntry: HistoryEntry | null
  diffResult: DiffResult | null
  diffOpen: boolean
  milestoneDialogEntry: HistoryEntry | null
  editDialogEntry: HistoryEntry | null
  selectedNodeId: string | null

  // Actions
  loadResumes: () => Promise<void>
  selectResume: (id: string, name: string, isOffline: boolean) => Promise<void>
  setPreviewEntry: (entry: HistoryEntry | null) => Promise<void>
  setRestoreEntry: (entry: HistoryEntry | null) => void
  confirmRestore: (navigate: (path: string) => void) => Promise<void>
  setMilestone: (entryId: string, label: string) => void
  removeMilestone: (entryId: string) => void
  setMilestoneDialogEntry: (entry: HistoryEntry | null) => void
  setEditDialogEntry: (entry: HistoryEntry | null) => void
  updateEntryLabel: (entryId: string, label: string) => void
  deleteEntry: (entryId: string) => void
  insertEntryAfter: (afterEntryId: string | null) => void
  openDiff: (source: HistoryEntry, target: HistoryEntry) => Promise<void>
  closeDiff: () => void
  setDiffSourceEntry: (entry: HistoryEntry | null) => void
  setSelectedNodeId: (id: string | null) => void
}

const useHistoryStore = create<HistoryState>()((set, get) => ({
  resumeList: [],
  loadingResumes: true,
  selectedResumeId: null,
  selectedResumeName: '',
  isSelectedOffline: false,
  historyList: [],
  allChanges: [],
  loading: false,
  milestones: new Map(),
  previewEntry: null,
  previewData: null,
  restoreEntry: null,
  restoring: false,
  diffSourceEntry: null,
  diffTargetEntry: null,
  diffResult: null,
  diffOpen: false,
  milestoneDialogEntry: null,
  editDialogEntry: null,
  selectedNodeId: null,

  loadResumes: async () => {
    set({ loadingResumes: true })
    try {
      const allResumes: ResumeInfo[] = []
      const user = await getCurrentUser()
      if (user) {
        try {
          const onlineResumes = await getAllResumesFromUser()
          allResumes.push(
            ...onlineResumes.map(r => ({
              id: r.resume_id,
              name: r.display_name || '未命名简历',
              isOffline: false,
            })),
          )
        }
        catch (error) {
          console.error('加载在线简历失败', error)
        }
      }
      try {
        const offlineResumes = await getAllOfflineResumes()
        allResumes.push(
          ...offlineResumes.map(r => ({
            id: r.resume_id,
            name: r.display_name || '未命名简历',
            isOffline: true,
          })),
        )
      }
      catch (error) {
        console.error('加载离线简历失败', error)
      }
      set({ resumeList: allResumes })
    }
    catch (error) {
      console.error('加载简历列表失败', error)
    }
    finally {
      set({ loadingResumes: false })
    }
  },

  selectResume: async (id, name, isOffline) => {
    set({
      selectedResumeId: id,
      selectedResumeName: name,
      isSelectedOffline: isOffline,
      historyList: [],
      allChanges: [],
    })

    if (isOffline)
      return

    set({ loading: true })
    try {
      const { loadResumeData } = useResumeStore.getState()
      await loadResumeData(id)

      const latestStore = useResumeStore.getState()
      const doc = latestStore.docHandle?.doc()
      if (!doc) {
        set({ loading: false })
        return
      }

      const Automerge = await import('@automerge/automerge')
      const changes = Automerge.getAllChanges(doc)
      set({ allChanges: changes })

      const decodedChanges = changes.map((change, index) => {
        const decoded = Automerge.decodeChange(change)
        return {
          hash: decoded.hash,
          time: decoded.time ? decoded.time * 1000 : null,
          message: decoded.message || null,
          index,
          change,
        }
      })

      // 按时间间隔合并变更
      const mergedEntries: HistoryEntry[] = []
      let currentGroup: typeof decodedChanges = []

      for (let i = 0; i < decodedChanges.length; i++) {
        const current = decodedChanges[i]
        const prev = decodedChanges[i - 1]

        if (
          !prev
          || !current.time
          || !prev.time
          || current.time - prev.time > MERGE_INTERVAL_MS
        ) {
          if (currentGroup.length > 0) {
            const lastInGroup = currentGroup[currentGroup.length - 1]
            mergedEntries.push({
              id: lastInGroup.hash || `group-${mergedEntries.length}`,
              snapshot: null,
              time: lastInGroup.time ? new Date(lastInGroup.time) : null,
              message: lastInGroup.message,
              index: lastInGroup.index,
              change: lastInGroup.change,
              changeCount: currentGroup.length,
            })
          }
          currentGroup = [current]
        }
        else {
          currentGroup.push(current)
        }
      }

      if (currentGroup.length > 0) {
        const lastInGroup = currentGroup[currentGroup.length - 1]
        mergedEntries.push({
          id: lastInGroup.hash || `group-${mergedEntries.length}`,
          snapshot: null,
          time: lastInGroup.time ? new Date(lastInGroup.time) : null,
          message: lastInGroup.message,
          index: lastInGroup.index,
          change: lastInGroup.change,
          changeCount: currentGroup.length,
        })
      }

      // 应用保存的里程碑
      const { milestones } = get()
      const list = mergedEntries.reverse().map(entry => ({
        ...entry,
        isMilestone: milestones.has(entry.id),
        milestoneLabel: milestones.get(entry.id)?.label,
      }))

      set({ historyList: list })
    }
    catch (error) {
      console.error('加载历史记录失败', error)
      toast.error('加载历史记录失败')
    }
    finally {
      set({ loading: false })
    }
  },

  setPreviewEntry: async (entry) => {
    if (!entry) {
      set({ previewEntry: null, previewData: null })
      return
    }
    const { allChanges } = get()
    const configState = useResumeConfigStore.getState()
    const fallbackConfig = { theme: configState.theme, font: configState.font, spacing: configState.spacing }
    const snapshot = await buildSnapshot(allChanges, entry.index, fallbackConfig)
    if (snapshot) {
      set({ previewEntry: entry, previewData: snapshot })
    }
    else {
      toast.error('无法预览此版本')
    }
  },

  setRestoreEntry: entry => set({ restoreEntry: entry }),

  confirmRestore: async (navigate) => {
    const { restoreEntry, selectedResumeId, allChanges } = get()
    if (!restoreEntry || !selectedResumeId)
      return

    set({ restoring: true })
    try {
      const snapshot = await buildSnapshot(allChanges, restoreEntry.index, {
        theme: useResumeConfigStore.getState().theme,
        font: useResumeConfigStore.getState().font,
        spacing: useResumeConfigStore.getState().spacing,
      })
      if (!snapshot) {
        toast.error('无法恢复此版本')
        set({ restoring: false })
        return
      }

      const currentFormState = useResumeStore.getState()
      useResumeStore.setState({
        basics: snapshot.basics ?? currentFormState.basics,
        job_intent: snapshot.job_intent ?? snapshot.jobIntent ?? currentFormState.job_intent,
        edu_background: snapshot.edu_background ?? snapshot.eduBackground ?? currentFormState.edu_background,
        work_experience: snapshot.work_experience ?? snapshot.workExperience ?? currentFormState.work_experience,
        internship_experience: snapshot.internship_experience ?? snapshot.internshipExperience ?? currentFormState.internship_experience,
        project_experience: snapshot.project_experience ?? snapshot.projectExperience ?? currentFormState.project_experience,
        campus_experience: snapshot.campus_experience ?? snapshot.campusExperience ?? currentFormState.campus_experience,
        skill_specialty: snapshot.skill_specialty ?? snapshot.skillSpecialty ?? currentFormState.skill_specialty,
        honors_certificates: snapshot.honors_certificates ?? snapshot.honorsCertificates ?? currentFormState.honors_certificates,
        self_evaluation: snapshot.self_evaluation ?? snapshot.selfEvaluation ?? currentFormState.self_evaluation,
        hobbies: snapshot.hobbies ?? currentFormState.hobbies,
        order: migrateOrder(snapshot.order ?? currentFormState.order),
        visibility: migrateVisibility(snapshot.visibility ?? currentFormState.visibility),
        type: snapshot.type ?? currentFormState.type,
      })

      const currentConfigState = useResumeConfigStore.getState()
      useResumeConfigStore.setState({
        theme: snapshot.config?.theme ?? currentConfigState.theme,
        font: snapshot.config?.font ?? currentConfigState.font,
        spacing: snapshot.config?.spacing ?? currentConfigState.spacing,
      })

      toast.success('已恢复到选中版本')
      set({ restoreEntry: null })
      navigate(`/resume/editor?resumeId=${selectedResumeId}`)
    }
    catch (error) {
      console.error('恢复版本失败', error)
      toast.error('恢复版本失败')
    }
    finally {
      set({ restoring: false })
    }
  },

  setMilestone: (entryId, label) => {
    const { milestones, historyList } = get()
    const newMilestones = new Map(milestones)
    newMilestones.set(entryId, {
      entryId,
      label,
      createdAt: new Date(),
    })

    const updatedList = historyList.map(entry =>
      entry.id === entryId
        ? { ...entry, isMilestone: true, milestoneLabel: label }
        : entry,
    )

    set({ milestones: newMilestones, historyList: updatedList })
    toast.success(`已创建里程碑: ${label}`)
  },

  removeMilestone: (entryId) => {
    const { milestones, historyList } = get()
    const newMilestones = new Map(milestones)
    newMilestones.delete(entryId)

    const updatedList = historyList.map(entry =>
      entry.id === entryId
        ? { ...entry, isMilestone: false, milestoneLabel: undefined }
        : entry,
    )

    set({ milestones: newMilestones, historyList: updatedList })
    toast.success('已移除里程碑')
  },

  setMilestoneDialogEntry: entry => set({ milestoneDialogEntry: entry }),

  setEditDialogEntry: entry => set({ editDialogEntry: entry }),

  updateEntryLabel: (entryId, label) => {
    const { historyList } = get()
    const updatedList = historyList.map(entry =>
      entry.id === entryId ? { ...entry, label } : entry,
    )
    set({ historyList: updatedList })
    toast.success('版本标签已更新')
  },

  deleteEntry: (entryId) => {
    const { historyList } = get()
    const updatedList = historyList.filter(entry => entry.id !== entryId)
    set({ historyList: updatedList })
    toast.success('已删除版本')
  },

  insertEntryAfter: (afterEntryId) => {
    const { historyList } = get()

    // Find adjacent entry to inherit its index for preview capability
    let inheritIndex = -1
    if (afterEntryId) {
      const afterEntry = historyList.find(e => e.id === afterEntryId)
      if (afterEntry)
        inheritIndex = afterEntry.index
    }
    else if (historyList.length > 0) {
      // When inserting at head, inherit from the latest (first) entry
      inheritIndex = historyList[0].index
    }

    const newEntry: HistoryEntry = {
      id: `custom-${Date.now()}`,
      snapshot: null,
      time: new Date(),
      message: '手动创建的版本',
      index: inheritIndex,
      change: new Uint8Array(),
      label: '新版本',
    }

    if (!afterEntryId) {
      set({ historyList: [newEntry, ...historyList] })
    }
    else {
      const idx = historyList.findIndex(e => e.id === afterEntryId)
      if (idx === -1) {
        set({ historyList: [...historyList, newEntry] })
      }
      else {
        const updated = [...historyList]
        updated.splice(idx + 1, 0, newEntry)
        set({ historyList: updated })
      }
    }
    toast.success('已插入新版本')
  },

  openDiff: async (source, target) => {
    const { allChanges } = get()
    const configFallback = {
      theme: useResumeConfigStore.getState().theme,
      font: useResumeConfigStore.getState().font,
      spacing: useResumeConfigStore.getState().spacing,
    }
    const [sourceSnapshot, targetSnapshot] = await Promise.all([
      buildSnapshot(allChanges, source.index, configFallback),
      buildSnapshot(allChanges, target.index, configFallback),
    ])

    if (!sourceSnapshot || !targetSnapshot) {
      toast.error('无法加载版本数据进行对比')
      return
    }

    const result = computeDiff(sourceSnapshot, targetSnapshot)
    set({
      diffSourceEntry: source,
      diffTargetEntry: target,
      diffResult: result,
      diffOpen: true,
    })
  },

  closeDiff: () =>
    set({
      diffSourceEntry: null,
      diffTargetEntry: null,
      diffResult: null,
      diffOpen: false,
    }),

  setDiffSourceEntry: entry => set({ diffSourceEntry: entry }),

  setSelectedNodeId: id => set({ selectedNodeId: id }),
}))

export default useHistoryStore
