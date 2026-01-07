/* eslint-disable no-console */
/*
 * @Author: lll 347552878@qq.com
 * @Date: 2025-10-24 21:56:16
 * @LastEditors: shemingcong shemingcong@dcarlife.com
 * @LastEditTime: 2026-01-07 11:03:02
 * @FilePath: /resume/src/lib/offline-resume-manager.ts
 * @Description: 离线简历管理器,使用 IndexedDB 存储本地简历
 */

import type { DBSchema, IDBPDatabase } from 'idb'
import type { ResumeSchema } from '@/lib/schema'
import dayjs from 'dayjs'
import { openDB } from 'idb'

interface ResumeDB extends DBSchema {
  resumes: {
    key: string // resume_id
    value: {
      resume_id: string
      display_name: string
      description?: string
      type: string
      created_at: string
      updated_at: string
      data: Partial<ResumeSchema>
    }
    indexes: {
      created_at: string
      updated_at: string
    }
  }
}

const DB_NAME = 'offline-resumes'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<ResumeDB> | null = null

/**
 * 获取或创建数据库实例
 */
async function getDB(): Promise<IDBPDatabase<ResumeDB>> {
  if (dbInstance)
    return dbInstance

  dbInstance = await openDB<ResumeDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // 创建 resumes 对象存储
      if (!db.objectStoreNames.contains('resumes')) {
        const resumeStore = db.createObjectStore('resumes', { keyPath: 'resume_id' })
        resumeStore.createIndex('created_at', 'created_at')
        resumeStore.createIndex('updated_at', 'updated_at')
      }
    },
  })

  return dbInstance
}

/**
 * 生成唯一的简历 ID
 */
function generateResumeId(): string {
  return `local-${crypto.randomUUID()}`
}

/**
 * 创建新的离线简历
 */
export async function createOfflineResume(options: {
  display_name?: string
  description?: string
  type?: string
}): Promise<string> {
  const db = await getDB()
  const resumeId = generateResumeId()

  const resume = {
    resume_id: resumeId,
    display_name: options.display_name || '未命名简历',
    description: options.description || '',
    type: options.type || 'default',
    created_at: dayjs().toISOString(),
    updated_at: dayjs().toISOString(),
    data: {},
  }

  await db.add('resumes', resume)

  console.log('✅ 创建离线简历', { resumeId, display_name: resume.display_name })

  return resumeId
}

/**
 * 获取所有离线简历
 */
export async function getAllOfflineResumes() {
  const db = await getDB()
  const resumes = await db.getAllFromIndex('resumes', 'created_at')

  // 按创建时间倒序排列
  return resumes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

/**
 * 获取单个离线简历
 */
export async function getOfflineResumeById(resumeId: string) {
  const db = await getDB()
  return await db.get('resumes', resumeId)
}

/**
 * 更新离线简历数据
 */
export async function updateOfflineResume(
  resumeId: string,
  data: Partial<ResumeSchema> & { order?: any, visibility?: any },
) {
  const db = await getDB()
  const resume = await db.get('resumes', resumeId)

  if (!resume) {
    throw new Error('简历不存在')
  }

  resume.data = { ...resume.data, ...data }
  resume.updated_at = dayjs().toISOString()

  await db.put('resumes', resume)

  console.log('✅ 更新离线简历', { resumeId })
}

/**
 * 更新简历元信息
 */
export async function updateOfflineResumeMeta(resumeId: string, meta: { display_name?: string, description?: string }) {
  const db = await getDB()
  const resume = await db.get('resumes', resumeId)

  if (!resume) {
    throw new Error('简历不存在')
  }

  if (meta.display_name !== undefined)
    resume.display_name = meta.display_name
  if (meta.description !== undefined)
    resume.description = meta.description
  resume.updated_at = new Date().toISOString()

  await db.put('resumes', resume)

  console.log('✅ 更新离线简历元信息', { resumeId, meta })
}

/**
 * 删除离线简历
 */
export async function deleteOfflineResume(resumeId: string) {
  const db = await getDB()
  await db.delete('resumes', resumeId)

  console.log('🗑️ 删除离线简历', { resumeId })
}

/**
 * 检查是否为离线简历 ID
 */
export function isOfflineResumeId(resumeId: string): boolean {
  return resumeId.startsWith('local-')
}

/**
 * 清空所有离线简历（用于登录后迁移）
 */
export async function clearAllOfflineResumes() {
  const db = await getDB()
  await db.clear('resumes')

  console.log('🧹 清空所有离线简历')
}

/**
 * 将本地简历迁移到云端
 * 用于登录后同步本地数据
 */
export async function migrateOfflineResumesToCloud(
  uploadFn: (resume: { display_name: string, description?: string, type: string, data: any }) => Promise<string>,
  selectedIds?: string[],
): Promise<{ success: number, failed: number, errors: string[] }> {
  let offlineResumes = await getAllOfflineResumes()

  // 如果指定了选择的ID，只迁移这些简历
  if (selectedIds && selectedIds.length > 0) {
    offlineResumes = offlineResumes.filter(r => selectedIds.includes(r.resume_id))
  }

  if (offlineResumes.length === 0) {
    console.log('📭 没有需要迁移的本地简历')
    return { success: 0, failed: 0, errors: [] }
  }

  console.log(`📤 开始迁移 ${offlineResumes.length} 个本地简历到云端...`)

  let success = 0
  let failed = 0
  const errors: string[] = []

  for (const resume of offlineResumes) {
    try {
      // 上传简历到云端
      await uploadFn({
        display_name: resume.display_name,
        description: resume.description,
        type: resume.type,
        data: resume.data,
      })

      // 上传成功后删除本地简历
      await deleteOfflineResume(resume.resume_id)
      success++
      console.log(`✅ 成功迁移简历: ${resume.display_name}`)
    }
    catch (error) {
      failed++
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      errors.push(`${resume.display_name}: ${errorMsg}`)
      console.error(`❌ 迁移简历失败: ${resume.display_name}`, error)
    }
  }

  console.log(`📊 迁移完成: 成功 ${success} 个, 失败 ${failed} 个`)

  return { success, failed, errors }
}

/**
 * 导出离线简历为 JSON（用于备份或迁移）
 */
export async function exportOfflineResume(resumeId: string): Promise<string> {
  const resume = await getOfflineResumeById(resumeId)

  if (!resume) {
    throw new Error('简历不存在')
  }

  return JSON.stringify(resume, null, 2)
}

/**
 * 导入离线简历（从 JSON）
 */
export async function importOfflineResume(jsonData: string): Promise<string> {
  const data = JSON.parse(jsonData)
  const db = await getDB()

  // 生成新的 ID 避免冲突
  const newResumeId = generateResumeId()
  const resume = {
    ...data,
    resume_id: newResumeId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  await db.add('resumes', resume)

  console.log('📥 导入离线简历', { resumeId: newResumeId })

  return newResumeId
}
