import type { ApplicationStatus, JobApplication, StageDetail } from '@/pages/tracker/types'
import supabase from '../client'
import { getCurrentUser } from '../user'

// 获取用户所有公司/职位
export async function getCompanies(): Promise<JobApplication[]> {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('company')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  // 转换 stage_details JSON 为数组
  return (data || []).map(item => ({
    ...item,
    stage_details: (item.stage_details || []) as StageDetail[],
  }))
}

// 创建新公司/职位
export async function createCompany(
  jobData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
): Promise<JobApplication> {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('company')
    .insert({
      user_id: user.id,
      ...jobData,
    })
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    stage_details: (data.stage_details || []) as StageDetail[],
  }
}

// 更新公司/职位
export async function updateCompany(
  id: string,
  updates: Partial<Omit<JobApplication, 'id' | 'created_at' | 'user_id'>>,
): Promise<JobApplication> {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { data, error } = await supabase
    .from('company')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return {
    ...data,
    stage_details: (data.stage_details || []) as StageDetail[],
  }
}

// 更新状态
export async function updateCompanyStatus(
  id: string,
  status: ApplicationStatus,
): Promise<void> {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { error } = await supabase
    .from('company')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}

// 删除公司/职位
export async function deleteCompany(id: string): Promise<void> {
  const user = await getCurrentUser()

  if (!user)
    throw new Error('用户未登陆')

  const { error } = await supabase
    .from('company')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw error
  }
}
