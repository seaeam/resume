import { DEFAULT_RESUME_APPEARANCE } from '@/lib/schema'
import supabase from '../client'
import { getCurrentUser } from '../user'

const RESUME_PERSISTED_FIELDS = [
  'basics',
  'job_intent',
  'application_info',
  'edu_background',
  'work_experience',
  'internship_experience',
  'campus_experience',
  'project_experience',
  'skill_specialty',
  'honors_certificates',
  'self_evaluation',
  'hobbies',
  'order',
  'visibility',
  'type',
  'spacing',
  'font',
  'theme',
] as const

export const RESUME_PERSISTED_SELECTOR = RESUME_PERSISTED_FIELDS.join(',')

export async function getAllResumesFromUser() {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('resume_config')
    .select('id,resume_id,created_at,updated_at,type,display_name,description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return data
}

export async function getResumeById<T extends string>(id: string, selector = '*' as T) {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('resume_config')
    .select(selector)
    .eq('user_id', user.id)
    .eq('resume_id', id)
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function uploadOfflineResumeToCloud(
  resumeData: Record<string, unknown>,
  info: { display_name: string, description?: string },
  type: string = 'default',
) {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  // 安全字段白名单，避免覆盖 user_id 等安全字段
  const ALLOWED_FIELDS = [...RESUME_PERSISTED_FIELDS]
  const safeData: Record<string, unknown> = {}
  for (const key of ALLOWED_FIELDS) {
    if (key in resumeData) {
      safeData[key] = resumeData[key]
    }
  }

  const { data, error } = await supabase
    .from('resume_config')
    .insert({
      user_id: user.id,
      type,
      ...DEFAULT_RESUME_APPEARANCE,
      ...info,
      ...safeData,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createNewResume(
  info: { display_name?: string, description?: string } = {
    display_name: '简历',
    description: new Date().toLocaleDateString(),
  },
  type: string = 'default',
) {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('resume_config')
    .insert({
      user_id: user.id,
      type,
      ...DEFAULT_RESUME_APPEARANCE,
      ...info,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/**
 * 删除简历
 * @param id 标识值
 * @param by 按哪个列删除，默认 'resume_id'
 */
export async function deleteResume(id: string, by: 'resume_id' | 'id' = 'resume_id') {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { error } = await supabase.from('resume_config').delete().eq(by, id).eq('user_id', user.id)

  if (error) {
    throw error
  }

  return true
}

/** @deprecated 使用 deleteResume(id, 'id') 替代 */
export const deleteResumeFromId = (id: string) => deleteResume(id, 'id')
