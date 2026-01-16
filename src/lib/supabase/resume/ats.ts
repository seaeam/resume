import type { FixChecklistItem } from '@/pages/optimize/types'
import supabase from '../client'
import { getCurrentUser } from '../user'

export async function getAtsFromUserId() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { data, error } = await supabase
    .from('ats')
    .select('history,version,resume_id,meta,readabilityIndex,fixChecklist,summary,scores,findings')
    .eq('user_id', user.id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updateFixChecklist(fixChecklist: FixChecklistItem[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登陆')
  }

  const { error, data } = await supabase
    .from('ats')
    .update({ fixChecklist })
    .eq('user_id', user.id)
    .select()

  if (error) {
    throw error
  }

  if (data.length === 0) {
    throw new Error('更新失败')
  }
}
