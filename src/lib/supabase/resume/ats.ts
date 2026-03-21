import type { AtsEvaluationResult, Summary } from '../../../pages/optimize/types'
import type { FixChecklistItem } from '@/pages/optimize/types'
import supabase from '../client'
import { getCurrentUser } from '../user'

export interface AtsSummaryRecord {
  id: string
  resume_id: string
  created_at: string
  todo_items: string[]
  summary: Pick<Summary, 'overall_score'> | null
}

export async function getAtsFromUserId() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('ats')
    .select('*')
    .eq('user_id', user.id)

  if (error) {
    throw error
  }

  return data as AtsEvaluationResult[]
}

export async function listAtsSummaries() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('ats')
    .select('id,resume_id,created_at,todo_items,summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []) as AtsSummaryRecord[]
}

export async function updateAtsConfig(id: string, payload: Record<string, any>) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { error } = await supabase
    .from('ats')
    .update(payload)
    .eq('user_id', user.id)
    .eq('id', id)

  if (error) {
    throw error
  }
}

export async function createAtsConfig(payload: Omit<AtsEvaluationResult, 'id'>) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('ats')
    .insert({
      ...payload,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data as AtsEvaluationResult
}

export async function updateFixChecklist(fixChecklist: FixChecklistItem[], id: string) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { error } = await supabase
    .from('ats')
    .update({ fixChecklist })
    .eq('user_id', user.id)
    .eq('id', id)

  if (error) {
    throw error
  }
}
