import type { HistoryCurrentResume, RestoreStrategy, VersionMetadataDraft } from '../types'
import type { ResumeHistoryVersionRecord } from '@/lib/supabase/resume/history'

export interface HistoryStoreState {
  // Data slice
  resumeId: string | null
  currentResume: HistoryCurrentResume | null
  versions: ResumeHistoryVersionRecord[]
  error: string | null

  init: (resumeId: string | null | undefined) => Promise<void>
  reload: () => Promise<void>
  saveCurrentVersion: (draft: VersionMetadataDraft) => Promise<ResumeHistoryVersionRecord | null>
  updateVersionMetadata: (versionId: number, draft: VersionMetadataDraft) => Promise<ResumeHistoryVersionRecord | null>
  restoreVersion: (versionId: number, strategy: RestoreStrategy) => Promise<ResumeHistoryVersionRecord | null>
  deleteVersion: (versionId: number) => Promise<boolean>

  // UI slice
  loading: boolean
  savingCurrent: boolean
  savingMetadata: boolean
  restoring: boolean
  deletingVersionId: number | null
}
