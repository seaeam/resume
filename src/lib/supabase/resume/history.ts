import type { ORDERType, ResumeSchema, ResumeType, VisibilityFormType } from '@/lib/schema'
import supabase from '../client'
import { getCurrentUser } from '../user'
import { getResumeById } from './form'

export type ResumeVersionSourceType
  = | 'manual'
    | 'autosave'
    | 'restore'
    | 'ai_optimize'
    | 'import'

export interface ResumeSnapshot extends ResumeSchema {
  order: ORDERType[]
  visibility: VisibilityFormType
  type: ResumeType
}

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
}

export interface ResumeHistoryOptionRecord {
  resume_id: string
  updated_at: string | null
  display_name: string | null
  description: string | null
  type: ResumeType | null
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
  visibility
`

const RESUME_OPTION_SELECTOR = `
  resume_id,
  updated_at,
  display_name,
  description,
  type
`

export async function getResumeHistoryResume(resumeId: string) {
  const data = await getResumeById(resumeId, RESUME_SELECTOR)
  return data as ResumeHistoryResumeRecord
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
