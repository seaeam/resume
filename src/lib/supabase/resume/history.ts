import type { ORDERType, PersistedResumeSnapshot, ResumeType, VisibilityFormType } from '@/lib/schema'
import { replaceAutomergeDocumentSnapshot } from '@/lib/automerge'
import supabase from '../client'
import { getCurrentUser } from '../user'
import { getResumeById } from './form'

export type ResumeVersionSourceType
  = | 'manual'
    | 'autosave'
    | 'restore'
    | 'ai_optimize'
    | 'import'

export type RestoreStrategy = 'with_backup' | 'without_backup'

export type ResumeSnapshot = PersistedResumeSnapshot

interface ResumeHistoryVersionBase<TSnapshot> {
  id: number
  created_at: string
  updated_at: string
  user_id: string
  resume_id: string
  version_no: number
  version_name: string | null
  description: string | null
  milestone_name: string | null
  source_type: ResumeVersionSourceType
  tags: string[] | null
  snapshot: TSnapshot
  content_hash: string | null
  base_updated_at: string | null
}

export type ResumeHistoryVersionRow = ResumeHistoryVersionBase<ResumeSnapshot | Record<string, unknown>>

export type ResumeHistoryVersionRecord = ResumeHistoryVersionBase<ResumeSnapshot>

export interface ResumeHistoryResumeRecord {
  resume_id: string
  updated_at: string | null
  display_name: string | null
  description: string | null
  type: ResumeType | null
  basics: Record<string, unknown> | null
  job_intent: Record<string, unknown> | null
  application_info: Record<string, unknown> | null
  edu_background: Record<string, unknown> | null
  work_experience: Record<string, unknown> | null
  internship_experience: Record<string, unknown> | null
  campus_experience: Record<string, unknown> | null
  project_experience: Record<string, unknown> | null
  skill_specialty: Record<string, unknown> | null
  honors_certificates: Record<string, unknown> | null
  self_evaluation: Record<string, unknown> | null
  hobbies: Record<string, unknown> | null
  order: ORDERType[] | string[] | null
  visibility: VisibilityFormType | Record<string, boolean> | null
  spacing: Record<string, unknown> | null
  font: Record<string, unknown> | null
  theme: Record<string, unknown> | null
}

export interface ResumeHistoryOptionRecord {
  resume_id: string
  updated_at: string | null
  display_name: string | null
  description: string | null
  type: ResumeType | null
}

export interface ResumeHistoryVersionSummaryRecord {
  resume_id: string
  version_no: number
  created_at: string
  source_type: ResumeVersionSourceType
  milestone_name: string | null
}

export interface CreateResumeHistoryVersionInput {
  resume_id: string
  version_name?: string | null
  description?: string | null
  milestone_name?: string | null
  source_type?: ResumeVersionSourceType
  tags?: string[]
  snapshot: ResumeSnapshot | Record<string, unknown>
  content_hash?: string | null
  base_updated_at?: string | null
}

export interface UpdateResumeHistoryVersionInput {
  version_name?: string | null
  description?: string | null
  milestone_name?: string | null
  tags?: string[]
}

export interface RestoreResumeHistoryVersionInput {
  resumeId: string
  targetVersion: ResumeHistoryVersionRecord
  currentSnapshot: ResumeSnapshot
  currentUpdatedAt: string | null
  strategy: RestoreStrategy
}

const VERSION_SELECTOR = `
  id,
  created_at,
  updated_at,
  user_id,
  resume_id,
  version_no,
  version_name,
  description,
  milestone_name,
  source_type,
  tags,
  snapshot,
  content_hash,
  base_updated_at
`

const RESUME_SELECTOR = `
  resume_id,
  updated_at,
  display_name,
  description,
  type,
  basics,
  job_intent,
  application_info,
  edu_background,
  work_experience,
  internship_experience,
  campus_experience,
  project_experience,
  skill_specialty,
  honors_certificates,
  self_evaluation,
  hobbies,
  order,
  visibility,
  spacing,
  font,
  theme
`

const RESUME_OPTION_SELECTOR = `
  resume_id,
  updated_at,
  display_name,
  description,
  type
`

const VERSION_SUMMARY_SELECTOR = `
  resume_id,
  version_no,
  created_at,
  source_type,
  milestone_name
`

export async function getResumeHistoryResume(resumeId: string) {
  return getResumeById<ResumeHistoryResumeRecord>(resumeId, RESUME_SELECTOR)
}

export async function listResumeHistoryOptions() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('resume_config')
    .select(RESUME_OPTION_SELECTOR)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ResumeHistoryOptionRecord[]
}

export async function listResumeHistoryVersions(resumeId: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('resume_config_versions')
    .select(VERSION_SELECTOR)
    .eq('resume_id', resumeId)
    .eq('user_id', user.id)
    .order('version_no', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ResumeHistoryVersionRow[]
}

export async function listResumeHistoryVersionSummaries() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('resume_config_versions')
    .select(VERSION_SUMMARY_SELECTOR)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as ResumeHistoryVersionSummaryRecord[]
}

export async function createResumeHistoryVersion(input: CreateResumeHistoryVersionInput) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('resume_config_versions')
    .insert({
      resume_id: input.resume_id,
      version_name: input.version_name ?? null,
      description: input.description ?? null,
      milestone_name: input.milestone_name ?? null,
      source_type: input.source_type ?? 'manual',
      tags: input.tags ?? [],
      snapshot: input.snapshot,
      content_hash: input.content_hash ?? null,
      base_updated_at: input.base_updated_at ?? null,
    })
    .select(VERSION_SELECTOR)
    .single()

  if (error) {
    throw error
  }

  return data as ResumeHistoryVersionRow
}

export async function restoreResumeHistoryVersion({
  resumeId,
  targetVersion,
  currentSnapshot,
  currentUpdatedAt,
  strategy,
}: RestoreResumeHistoryVersionInput) {
  if (strategy === 'with_backup') {
    await createResumeHistoryVersion({
      resume_id: resumeId,
      version_name: '恢复前备份',
      description: `恢复到 V${targetVersion.version_no} 前自动保存`,
      source_type: 'autosave',
      tags: ['恢复前备份'],
      snapshot: currentSnapshot,
      content_hash: await createResumeSnapshotHash(currentSnapshot),
      base_updated_at: currentUpdatedAt,
    })
  }

  const restoredSnapshot = await replaceAutomergeDocumentSnapshot(resumeId, targetVersion.snapshot)

  return createResumeHistoryVersion({
    resume_id: resumeId,
    version_name: `从 V${targetVersion.version_no} 恢复`,
    description: trimToNull(
      targetVersion.version_name
        ? `从「${targetVersion.version_name}」恢复当前内容`
        : `从 V${targetVersion.version_no} 恢复当前内容`,
    ),
    milestone_name: trimToNull(targetVersion.milestone_name),
    source_type: 'restore',
    tags: targetVersion.tags ?? [],
    snapshot: restoredSnapshot,
    content_hash: await createResumeSnapshotHash(restoredSnapshot),
    base_updated_at: currentUpdatedAt,
  })
}

export async function updateResumeHistoryVersion(id: number, input: UpdateResumeHistoryVersionInput) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('resume_config_versions')
    .update({
      version_name: input.version_name ?? null,
      description: input.description ?? null,
      milestone_name: input.milestone_name ?? null,
      tags: input.tags ?? [],
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select(VERSION_SELECTOR)
    .single()

  if (error) {
    throw error
  }

  return data as ResumeHistoryVersionRow
}

function trimToNull(value: string | null | undefined) {
  const nextValue = value?.trim()
  return nextValue || null
}

function sanitizeSnapshot(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sanitizeSnapshot(item))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, sanitizeSnapshot(item)]),
    )
  }

  return value
}

function sortSnapshotKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(item => sortSnapshotKeys(item))
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        result[key] = sortSnapshotKeys((value as Record<string, unknown>)[key])
        return result
      }, {})
  }

  return value
}

function stableSerializeSnapshot(snapshot: ResumeSnapshot) {
  return JSON.stringify(sortSnapshotKeys(sanitizeSnapshot(snapshot)))
}

export async function createResumeSnapshotHash(snapshot: ResumeSnapshot) {
  const content = stableSerializeSnapshot(snapshot)

  if (!globalThis.crypto?.subtle) {
    return content
  }

  const encoded = new TextEncoder().encode(content)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(digest))
    .map(value => value.toString(16).padStart(2, '0'))
    .join('')
}

export async function deleteResumeHistoryVersion(id: number) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { error } = await supabase
    .from('resume_config_versions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}
