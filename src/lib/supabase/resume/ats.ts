import type { FixChecklistItem } from '@/pages/optimize/types'
import supabase from '../client'
import { getCurrentUser } from '../user'

export async function getAtsFromUserId() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  const { data, error } = await supabase
    .from('ats')
    .select('version,resume_id,meta,readabilityIndex,fixChecklist,summary,scores,findings')
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
    throw new Error('用户未登录')
  }

  const { error } = await supabase
    .from('ats')
    .update({ fixChecklist })
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}

export async function getAtsResumeFromResumeId() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('用户未登录')
  }

  // 1. 获取所有简历配置
  const { data: allResumes, error: resumeError } = await supabase
    .from('resume_config')
    .select('display_name,description,resume_id,id,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (resumeError) {
    throw resumeError
  }

  if (allResumes.length === 0) {
    return []
  }

  // 2. 获取已打分的简历信息
  const { data: atsResumes, error: atsError } = await supabase
    .from('ats')
    .select('resume_id,created_at,summary->overall_score')
    .eq('user_id', user.id)

  if (atsError) {
    throw atsError
  }

  // 3. 合并数据，标注是否已打分
  const scoredResumeIds = new Set(atsResumes.map(item => item.resume_id))

  const result = allResumes.map((resume) => {
    const atsInfo = atsResumes.find(item => item.resume_id === resume.resume_id)
    const isScored = scoredResumeIds.has(resume.resume_id)

    return {
      id: resume.id,
      display_name: resume.display_name,
      description: resume.description,
      resume_id: resume.resume_id,
      created_at: atsInfo?.created_at ?? resume.created_at,
      overall_score: atsInfo?.overall_score ?? null,
      isScored,
    }
  })

  return result as Array<{
    id: string
    display_name: string
    description: string
    resume_id: string
    created_at: string
    overall_score: number | null
    isScored: boolean
  }>
}
