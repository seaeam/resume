/**
 * 文档管理器
 * @module core/manager
 * @description 管理 Automerge 文档生命周期、持久化和协作的核心逻辑。
 */

import type { DocHandle, Repo } from '@automerge/automerge-repo'
import type { AutomergeResumeDocument, ChangeFn } from '../types'
import type { CollaborationCallbacks } from '../adapters/supabase'
import { SupabaseNetworkAdapter } from '../adapters/supabase'
import { PersistenceService } from '../data/persistence'
import { getAutomergeRepo } from './repo'
import { logger } from '@/lib/logger'
import { DEFAULT_ORDER, DEFAULT_VISIBILITY } from '@/lib/schema'

/**
 * 管理 Automerge 文档的生命周期
 */
export class DocumentManager {
  private handle: DocHandle<AutomergeResumeDocument> | null = null
  private resumeId: string
  private userId: string
  private isInitializing: boolean = false
  private repo: Repo | null = null
  private networkAdapter: SupabaseNetworkAdapter | null = null
  private currentSessionId: string | null = null
  private saveListeners = new Set<(result: { success: boolean, error?: unknown }) => void>()
  private saveStartListeners = new Set<() => void>()
  private canPersistToSupabase = true
  private persistenceService: PersistenceService
  private saveTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * 创建一个新的 DocumentManager
   * @param {string} resumeId - 简历 ID
   * @param {string} userId - 用户 ID
   */
  constructor(resumeId: string, userId: string) {
    this.resumeId = resumeId
    this.userId = userId
    this.persistenceService = new PersistenceService(resumeId, userId)
  }

  /**
   * 初始化文档
   * @description 从 Supabase 加载现有文档或创建一个新文档。
   *
   * 算法流程:
   * ```mermaid
   * graph TD
   *   A[开始初始化] --> B{加载持久化数据}
   *   B -- 找到 URL --> C{检查 IndexedDB}
   *   C -- 找到 Handle --> D[返回 Handle]
   *   C -- 未找到 --> E{导入二进制}
   *   E -- 成功 --> D
   *   B -- 未找到 --> F{加载配置}
   *   F -- 权限错误 --> G[设置只读]
   *   F -- 成功 --> H[创建新文档]
   *   H --> I[应用配置]
   *   I --> J[保存到 Supabase]
   *   J --> D
   * ```
   *
   * @returns {Promise<DocHandle<AutomergeResumeDocument>>} 文档句柄
   */
  async initialize(): Promise<DocHandle<AutomergeResumeDocument>> {
    this.isInitializing = true

    const repo = getAutomergeRepo(this.resumeId)
    this.repo = repo

    // 尝试从 Supabase Automerge 存储加载
    const existingHandle = await this.loadFromPersistence(repo)
    if (existingHandle) {
      this.handle = existingHandle
      this.isInitializing = false
      this.networkAdapter?.setLocalDocumentInfo({
        documentUrl: this.getDocumentUrl(),
        documentId: this.getDocumentId(),
      })
      return existingHandle
    }

    // 尝试从 Supabase 简历配置加载（迁移或重新开始）
    const { data: supabaseData, isPermissionError } = await this.persistenceService.loadResumeConfig()
    if (isPermissionError) {
      this.canPersistToSupabase = false
      logger.warn('用户无法读取 resume_config，进入只读协作模式', { resumeId: this.resumeId })
    } else if (!supabaseData) {
      this.canPersistToSupabase = false
      logger.warn('未找到 resume_config，进入只读协作模式', { resumeId: this.resumeId })
    }

    // 创建新的 Automerge 文档
    const handle = repo.create<AutomergeResumeDocument>()

    handle.change((doc) => {
      doc._metadata = {
        resumeId: this.resumeId,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      // 如果有数据则复制
      if (supabaseData) {
        Object.assign(doc, supabaseData)
      }

      // 确保默认值
      if (!doc.order || doc.order.length === 0) {
        doc.order = [...DEFAULT_ORDER]
      }
      if (!doc.visibility) {
        doc.visibility = { ...DEFAULT_VISIBILITY }
      }
    })

    this.handle = handle

    // 等待就绪
    await handle.whenReady()

    this.networkAdapter?.setLocalDocumentInfo({
      documentUrl: this.getDocumentUrl(),
      documentId: this.getDocumentId(),
    })

    // 立即保存以确保可用性
    if (this.canPersistToSupabase) {
      await this.saveToSupabase(handle)
    }

    this.isInitializing = false
    return handle
  }

  /**
   * 从持久层加载文档
   * @private
   * @param {Repo} repo - Automerge Repo
   * @returns {Promise<DocHandle<AutomergeResumeDocument> | null>} Handle 或 null
   */
  private async loadFromPersistence(repo: Repo): Promise<DocHandle<AutomergeResumeDocument> | null> {
    const result = await this.persistenceService.loadAutomergeData()
    if (!result) return null

    const { documentUrl, binary } = result

    // 1. 尝试通过 URL 查找（IndexedDB 缓存）
    if (documentUrl) {
      try {
        const handle = await repo.find<AutomergeResumeDocument>(documentUrl as any)
        if (handle) {
          await handle.whenReady()
          return handle
        }
        logger.debug('本地未找到 documentUrl，回退到二进制导入')
      } catch (err) {
        logger.warn('通过 documentUrl 加载失败，回退到二进制导入', err as any)
      }
    }

    // 2. 从二进制导入
    if (binary && binary.length > 0) {
      try {
        const handle = repo.import<AutomergeResumeDocument>(binary)
        await handle.whenReady()
        return handle
      } catch (err) {
        logger.error('导入二进制数据失败', err as any)
      }
    }

    return null
  }

  /**
   * 保存当前文档到 Supabase
   * @param {DocHandle<AutomergeResumeDocument>} handle - 文档句柄
   */
  async saveToSupabase(handle: DocHandle<AutomergeResumeDocument>) {
    if (!this.canPersistToSupabase) {
      this.notifySaveListeners({ success: true })
      return
    }

    this.notifySaveStart()

    const result = await this.persistenceService.saveToSupabase(handle)

    if (!result.success) {
      if (result.isPermissionError) {
        this.canPersistToSupabase = false
        logger.warn('用户无法写入 automerge_documents，切换到只读协作模式', { resumeId: this.resumeId })
      }
      this.notifySaveListeners({ success: false, error: result.error })
    } else {
      this.notifySaveListeners({ success: true })
    }
  }

  /**
   * 注册保存结果监听器
   * @param {Function} listener - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onSaveResult(listener: (result: { success: boolean, error?: unknown }) => void): () => void {
    this.saveListeners.add(listener)
    return () => {
      this.saveListeners.delete(listener)
    }
  }

  /**
   * 注册保存开始监听器
   * @param {Function} listener - 回调函数
   * @returns {Function} 取消订阅函数
   */
  onSaveStart(listener: () => void): () => void {
    this.saveStartListeners.add(listener)
    return () => {
      this.saveStartListeners.delete(listener)
    }
  }

  /**
   * 通知所有保存监听器
   * @private
   */
  private notifySaveListeners(result: { success: boolean, error?: unknown }) {
    this.saveListeners.forEach((listener) => {
      try {
        listener(result)
      } catch (err) {
        console.error('⚠️ 保存监听器执行失败', err)
      }
    })
  }

  /**
   * 通知所有保存开始监听器
   * @private
   */
  private notifySaveStart() {
    this.saveStartListeners.forEach((listener) => {
      try {
        listener()
      } catch (err) {
        console.error('⚠️ 保存开始监听器执行失败', err)
      }
    })
  }

  /**
   * 启用协作会话
   * @param {string} sessionId - 会话 ID
   * @param {CollaborationCallbacks} callbacks - 事件回调
   * @returns {Promise<SupabaseNetworkAdapter>} 网络适配器
   */
  async enableCollaboration(sessionId: string, callbacks: CollaborationCallbacks = {}): Promise<SupabaseNetworkAdapter> {
    if (!this.repo) {
      throw new Error('Automerge repo 未初始化')
    }

    if (this.networkAdapter && this.currentSessionId === sessionId) {
      return this.networkAdapter
    }

    if (this.networkAdapter) {
      this.disableCollaboration()
    }

    logger.automerge.collab('准备协作', { sessionId, resumeId: this.resumeId })

    const adapter = new SupabaseNetworkAdapter(this.resumeId, sessionId, callbacks)
    adapter.setLocalDocumentInfo({
      documentUrl: this.getDocumentUrl(),
      documentId: this.getDocumentId(),
    })
    this.repo.networkSubsystem.addNetworkAdapter(adapter)
    this.networkAdapter = adapter
    this.currentSessionId = sessionId

    // 异步尝试加载远程快照
    this.tryLoadRemoteSnapshot(adapter)

    return adapter
  }

  /**
   * 尝试加载远程快照以确保我们是最新的
   * @private
   * @param {SupabaseNetworkAdapter} adapter - 适配器
   */
  private async tryLoadRemoteSnapshot(adapter: SupabaseNetworkAdapter) {
    try {
      if (this.handle) {
        adapter.setLocalDocumentInfo({
          documentUrl: this.getDocumentUrl(),
          documentId: this.getDocumentId(),
        })
        return
      }

      const result = await this.persistenceService.loadAutomergeData()
      if (!result) return

      const { documentUrl, binary } = result

      if (binary && binary.length > 0 && this.repo) {
        try {
          const imported = this.repo.import<AutomergeResumeDocument>(binary)
          await imported.whenReady()
          if (!this.handle) {
            this.handle = imported
          }
          logger.automerge.sync('成功从 Supabase 导入 Automerge 快照', { resumeId: this.resumeId })
        } catch (err) {
          logger.warn('导入 Automerge 二进制失败', err as any)
        }
      }

      const finalLocalUrl = this.getDocumentUrl() || documentUrl || null
      adapter.setLocalDocumentInfo({
        documentUrl: finalLocalUrl,
        documentId: this.getDocumentId(),
      })
    } catch (err) {
      logger.warn('异步加载 automerge_documents 失败', err as any)
    }
  }

  /**
   * 禁用协作
   */
  disableCollaboration() {
    if (this.repo && this.networkAdapter) {
      this.repo.networkSubsystem.removeNetworkAdapter(this.networkAdapter)
      this.networkAdapter = null
    }
    this.currentSessionId = null
  }

  /**
   * 获取协作频道名称
   * @returns {string | null} 频道名称
   */
  getCollaborationChannelName(): string | null {
    return this.networkAdapter?.getChannelName() ?? null
  }

  /**
   * 获取协作会话 ID
   * @returns {string | null} 会话 ID
   */
  getCollaborationSessionId(): string | null {
    return this.currentSessionId
  }

  /**
   * 广播协作事件
   * @param {string} type - 事件类型
   * @param {Record<string, any>} data - 事件数据
   */
  broadcastCollaborationEvent(type: string, data: Record<string, any> = {}) {
    this.networkAdapter?.broadcastControlMessage(type, data)
  }

  /**
   * 获取当前文档句柄
   * @returns {DocHandle<AutomergeResumeDocument> | null} 句柄
   */
  getHandle(): DocHandle<AutomergeResumeDocument> | null {
    return this.handle
  }

  /**
   * 获取文档 URL
   * @returns {string | null} URL
   */
  getDocumentUrl(): string | null {
    return this.handle?.url ?? null
  }

  /**
   * 获取文档 ID
   * @returns {string | null} ID
   */
  getDocumentId(): string | null {
    return this.handle?.documentId ?? null
  }

  /**
   * 获取文档快照
   * @returns {AutomergeResumeDocument | null} 快照
   */
  getDoc(): AutomergeResumeDocument | null {
    return this.handle?.doc() || null
  }

  /**
   * 修改文档
   * @param {ChangeFn<AutomergeResumeDocument>} changeFn - 修改函数
   */
  change(changeFn: ChangeFn<AutomergeResumeDocument>) {
    if (!this.handle) {
      logger.error('文档未初始化')
      return
    }

    this.handle.change((doc) => {
      changeFn(doc)
      doc._metadata.updatedAt = new Date().toISOString()
      doc._metadata.version += 1
    })

    this.debouncedSave()
  }

  /**
   * 防抖保存到 Supabase
   * @private
   */
  private debouncedSave() {
    if (this.isInitializing) {
      return
    }

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveTimeout = setTimeout(() => {
      if (this.handle) {
        this.saveToSupabase(this.handle)
      }
    }, 3000)
  }

  /**
   * 销毁管理器
   */
  destroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
    }

    this.saveListeners.clear()
    this.saveStartListeners.clear()
    this.disableCollaboration()
    this.repo = null
    this.handle = null
    this.saveListeners.clear()
  }
}
