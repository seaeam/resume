import type { HistoryCurrentResume, VersionMetadataDraft } from './types'
import type { ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'
import { toast } from 'sonner'
import { create } from 'zustand'
import { isOfflineResumeId } from '@/lib/offline-resume-manager'
import { createResumeHistoryVersion, deleteResumeHistoryVersion, getResumeHistoryResume, listResumeHistoryVersions, updateResumeConfig, updateResumeHistoryVersion } from '@/lib/supabase/resume'
import { buildCurrentResume, createSnapshotHash, normalizeHistoryVersion, toVersionMutationPayload, trimToNull } from './utils'

interface HistoryStore {
  resumeId: string | null
  currentResume: HistoryCurrentResume | null
  versions: ResumeHistoryVersionRecord[]
  loading: boolean
  savingCurrent: boolean
  savingMetadata: boolean
  restoring: boolean
  deletingVersionId: number | null
  error: string | null
  init: (resumeId: string | null | undefined) => Promise<void>
  reload: () => Promise<void>
  saveCurrentVersion: (draft: VersionMetadataDraft) => Promise<ResumeHistoryVersionRecord | null>
  updateVersionMetadata: (versionId: number, draft: VersionMetadataDraft) => Promise<ResumeHistoryVersionRecord | null>
  restoreVersion: (versionId: number) => Promise<ResumeHistoryVersionRecord | null>
  deleteVersion: (versionId: number) => Promise<boolean>
}

const useHistoryStore = create<HistoryStore>()((set, get) => {
  const hydrate = async (resumeId: string) => {
    const [resume, versions] = await Promise.all([
      getResumeHistoryResume(resumeId),
      listResumeHistoryVersions(resumeId),
    ])

    set({
      currentResume: buildCurrentResume(resume),
      versions: versions.map(normalizeHistoryVersion),
      error: null,
      loading: false,
    })
  }

  return {
    resumeId: null,
    currentResume: null,
    versions: [],
    loading: false,
    savingCurrent: false,
    savingMetadata: false,
    restoring: false,
    deletingVersionId: null,
    error: null,
    async init(resumeId) {
      if (!resumeId) {
        set({
          resumeId: null,
          currentResume: null,
          versions: [],
          loading: false,
          error: null,
        })
        return
      }

      if (isOfflineResumeId(resumeId)) {
        set({
          resumeId,
          currentResume: null,
          versions: [],
          loading: false,
          error: '历史版本当前仅支持云端简历，请先同步到云端后再查看。',
        })
        return
      }

      set({
        resumeId,
        currentResume: null,
        versions: [],
        loading: true,
        error: null,
      })

      try {
        await hydrate(resumeId)
      }
      catch (error) {
        const message = error instanceof Error ? error.message : '历史版本加载失败'
        set({
          loading: false,
          error: message,
          currentResume: null,
          versions: [],
        })
        toast.error(message)
      }
    },
    async reload() {
      const resumeId = get().resumeId

      if (!resumeId) {
        return
      }

      set({ loading: true })

      try {
        await hydrate(resumeId)
      }
      catch (error) {
        const message = error instanceof Error ? error.message : '历史版本刷新失败'
        set({ loading: false, error: message })
        toast.error(message)
      }
    },
    async saveCurrentVersion(draft) {
      const { resumeId, currentResume, versions } = get()

      if (!resumeId || !currentResume) {
        return null
      }

      set({ savingCurrent: true })

      try {
        const created = normalizeHistoryVersion(
          await createResumeHistoryVersion({
            resume_id: resumeId,
            ...toVersionMutationPayload(draft),
            source_type: 'manual',
            snapshot: currentResume.snapshot,
            content_hash: await createSnapshotHash(currentResume.snapshot),
            base_updated_at: currentResume.updatedAt,
          }),
        )

        set({
          versions: [created, ...versions],
        })
        toast.success('当前版本已保存到时间线')
        return created
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : '保存历史版本失败')
        return null
      }
      finally {
        set({ savingCurrent: false })
      }
    },
    async updateVersionMetadata(versionId, draft) {
      const versions = get().versions
      const targetVersion = versions.find(version => version.id === versionId)

      if (!targetVersion) {
        return null
      }

      set({ savingMetadata: true })

      try {
        const updated = normalizeHistoryVersion(
          await updateResumeHistoryVersion(versionId, toVersionMutationPayload(draft)),
        )

        set({
          versions: versions.map(version => version.id === updated.id ? updated : version),
        })
        toast.success('版本信息已更新')
        return updated
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : '更新版本信息失败')
        return null
      }
      finally {
        set({ savingMetadata: false })
      }
    },
    async restoreVersion(versionId) {
      const { resumeId, currentResume, versions } = get()
      const targetVersion = versions.find(version => version.id === versionId)

      if (!resumeId || !currentResume || !targetVersion) {
        return null
      }

      set({ restoring: true })

      try {
        await createResumeHistoryVersion({
          resume_id: resumeId,
          version_name: '恢复前快照',
          description: `恢复到 V${targetVersion.version_no} 前自动保存`,
          source_type: 'autosave',
          tags: ['恢复前快照'],
          snapshot: currentResume.snapshot,
          content_hash: await createSnapshotHash(currentResume.snapshot),
          base_updated_at: currentResume.updatedAt,
        })

        await updateResumeConfig(resumeId, targetVersion.snapshot)

        const restoredVersion = normalizeHistoryVersion(
          await createResumeHistoryVersion({
            resume_id: resumeId,
            version_name: `恢复自 V${targetVersion.version_no}`,
            description: trimToNull(
              targetVersion.version_name
                ? `从「${targetVersion.version_name}」恢复当前简历`
                : `从 V${targetVersion.version_no} 恢复当前简历`,
            ),
            milestone_name: trimToNull(targetVersion.milestone_name),
            source_type: 'restore',
            tags: targetVersion.tags ?? [],
            snapshot: targetVersion.snapshot,
            content_hash: targetVersion.content_hash ?? await createSnapshotHash(targetVersion.snapshot),
            base_updated_at: currentResume.updatedAt,
          }),
        )

        await hydrate(resumeId)
        toast.success('已恢复到所选历史版本')
        return restoredVersion
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : '恢复历史版本失败')
        return null
      }
      finally {
        set({ restoring: false })
      }
    },
    async deleteVersion(versionId) {
      const versions = get().versions
      const targetVersion = versions.find(version => version.id === versionId)

      if (!targetVersion) {
        return false
      }

      set({ deletingVersionId: versionId })

      try {
        await deleteResumeHistoryVersion(versionId)

        set({
          versions: versions.filter(version => version.id !== versionId),
        })

        toast.success(`已删除 V${targetVersion.version_no} 历史版本`)
        return true
      }
      catch (error) {
        toast.error(error instanceof Error ? error.message : '删除历史版本失败')
        return false
      }
      finally {
        set({ deletingVersionId: null })
      }
    },
  }
})

export default useHistoryStore
