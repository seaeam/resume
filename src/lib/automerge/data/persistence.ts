/**
 * 持久化服务
 * @module data/persistence
 * @description 处理 Automerge 文档到 Supabase 的加载和保存。
 */

import type { DocHandle } from '@automerge/automerge-repo'
import type { AutomergeResumeDocument } from '../types'
import type { ResumeSchema } from '@/lib/schema'
import { next as Automerge } from '@automerge/automerge'
import { logger } from '@/lib/logger'
import supabase from '@/lib/supabase/client'
import { byteaToUint8Array, uint8ArrayToBase64 } from '../utils'

/**
 * Automerge 数据加载结果
 */
export interface LoadAutomergeResult {
  documentUrl?: string
  binary?: Uint8Array
  metadata?: Record<string, any>
}

/**
 * 保存操作结果
 */
export interface SaveResult {
  success: boolean
  error?: unknown
  isPermissionError?: boolean
}

/**
 * 处理 Supabase 持久化的服务
 */
export class PersistenceService {
  private resumeId: string
  private userId: string

  constructor(resumeId: string, userId: string) {
    this.resumeId = resumeId
    this.userId = userId
  }

  /**
   * 从 Supabase 加载 Automerge 文档数据
   * @returns {Promise<LoadAutomergeResult | null>} 加载的数据，如果未找到则为 null
   */
  async loadAutomergeData(): Promise<LoadAutomergeResult | null> {
    try {
      const { data, error } = await supabase
        .from('automerge_documents')
        .select('document_data, metadata')
        .eq('resume_id', this.resumeId)
        .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        logger.error('查询 Automerge 文档失败', error as any)
        return null
      }

      if (!data) {
        return null
      }

      const metadata = data.metadata || {}
      const documentUrl = typeof metadata.documentUrl === 'string' ? metadata.documentUrl : undefined

      let binary: Uint8Array | undefined
      if (data.document_data) {
        const parsed = byteaToUint8Array(data.document_data)
        if (parsed) {
          binary = parsed
        }
        else {
          logger.error('解析 document_data 失败')
        }
      }

      return {
        documentUrl,
        binary,
        metadata,
      }
    }
    catch (err) {
      logger.error('从 Supabase 加载 Automerge 文档失败', err as any)
      return null
    }
  }

  /**
   * 从 Supabase 加载简历配置
   * @returns {Promise<{ data: Partial<ResumeSchema> | null, isPermissionError: boolean }>} 加载的配置
   */
  async loadResumeConfig(): Promise<{ data: Partial<ResumeSchema> | null, isPermissionError: boolean }> {
    const { data, error } = await supabase
      .from('resume_config')
      .select('*')
      .eq('resume_id', this.resumeId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42501') {
        return { data: null, isPermissionError: true }
      }

      logger.error('从 Supabase 加载 resume_config 失败', error as any)
      return { data: null, isPermissionError: false }
    }

    if (!data) {
      return { data: null, isPermissionError: false } // 未找到但没有权限错误
    }

    // 移除数据库特定字段
    const {
      id,
      created_at,
      updated_at,
      resume_id,
      user_id,
      automerge_enabled,
      document_version,
      total_changes_count,
      last_automerge_sync,
      sync_status,
      ...resumeData
    } = data

    return { data: resumeData, isPermissionError: false }
  }

  /**
   * 将 Automerge 文档保存到 Supabase
   * @param {DocHandle<AutomergeResumeDocument>} handle - 文档句柄
   * @returns {Promise<SaveResult>} 保存操作的结果
   */
  async saveToSupabase(handle: DocHandle<AutomergeResumeDocument>): Promise<SaveResult> {
    const doc = handle.doc()
    if (!doc) {
      return { success: false, error: '文档为空' }
    }

    const binary = Automerge.save(doc as any)
    const heads = Automerge.getHeads(doc as any)
    const base64 = uint8ArrayToBase64(binary)
    const documentUrl = handle.url

    const { error } = await supabase.from('automerge_documents').upsert(
      {
        resume_id: this.resumeId,
        user_id: this.userId,
        document_data: base64,
        heads,
        document_version: doc._metadata.version,
        change_count: 0,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(doc._metadata ? { docMetadata: doc._metadata } : {}),
          documentUrl,
        },
      },
      { onConflict: 'resume_id' },
    )

    if (error) {
      if (error?.code === '42501') {
        return { success: false, error, isPermissionError: true }
      }
      else {
        logger.error('保存到 Supabase 失败', error)
        return { success: false, error, isPermissionError: false }
      }
    }

    return { success: true }
  }
}
