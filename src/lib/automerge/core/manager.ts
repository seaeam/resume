/**
 * 文档管理器
 * @module core/manager
 * @description 管理 Automerge 文档生命周期、持久化和协作的核心逻辑。
 */

import type { DocHandle, Repo } from '@automerge/automerge-repo'
import type { CollaborationCallbacks, UIEventType } from '../adapters/supabase'
import type { AutomergeResumeDocument, ChangeFn } from '../types'
import { logger } from '@/lib/logger'
import { DEFAULT_ORDER, DEFAULT_VISIBILITY } from '@/lib/schema'
import { SupabaseNetworkAdapter } from '../adapters/supabase'
import { PersistenceService } from '../data/persistence'
import { getAutomergeRepo } from './repo'

interface SaveResult {
  success: boolean
  error?: unknown
}

/**
 * 管理 Automerge 文档的生命周期
 */
export class DocumentManager {
  private handle: DocHandle<AutomergeResumeDocument> | null = null
  private repo: Repo | null = null
  private networkAdapter: SupabaseNetworkAdapter | null = null
  private currentSessionId: string | null = null
  private isInitializing = false
  private canPersistToSupabase = true
  private saveTimeout: ReturnType<typeof setTimeout> | null = null

  private readonly resumeId: string
  private readonly userId: string
  private readonly persistenceService: PersistenceService
  private readonly saveListeners = new Set<(result: SaveResult) => void>()
  private readonly saveStartListeners = new Set<() => void>()

  constructor(resumeId: string, userId: string) {
    this.resumeId = resumeId
    this.userId = userId
    this.persistenceService = new PersistenceService(resumeId, userId)
  }

  // ==================== 公共 API ====================

  /**
   * 初始化文档
   */
  async initialize(): Promise<DocHandle<AutomergeResumeDocument>> {
    this.isInitializing = true
    this.repo = getAutomergeRepo(this.resumeId)

    try {
      // 尝试从持久层加载
      const existingHandle = await this.loadFromPersistence()
      if (existingHandle) {
        this.handle = existingHandle
        this.syncDocumentInfo()
        return existingHandle
      }

      // 创建新文档
      return await this.createNewDocument()
    }
    finally {
      this.isInitializing = false
    }
  }

  /**
   * 修改文档
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

    this.scheduleSave()
  }

  /**
   * 启用协作会话
   */
  async enableCollaboration(sessionId: string, callbacks: CollaborationCallbacks = {}): Promise<SupabaseNetworkAdapter> {
    if (!this.repo) {
      throw new Error('Automerge repo 未初始化')
    }

    if (this.networkAdapter && this.currentSessionId === sessionId) {
      return this.networkAdapter
    }

    this.disableCollaboration()

    logger.automerge.collab('准备协作', { sessionId, resumeId: this.resumeId })

    const adapter = new SupabaseNetworkAdapter(this.resumeId, sessionId, callbacks)
    adapter.setLocalDocumentInfo(this.getDocumentInfo())
    this.repo.networkSubsystem.addNetworkAdapter(adapter)
    this.networkAdapter = adapter
    this.currentSessionId = sessionId

    return adapter
  }

  /**
   * 禁用协作
   */
  disableCollaboration() {
    if (this.repo && this.networkAdapter) {
      this.repo.networkSubsystem.removeNetworkAdapter(this.networkAdapter)
    }
    this.networkAdapter = null
    this.currentSessionId = null
  }

  /**
   * 广播协作事件
   */
  broadcastCollaborationEvent(type: string, data: Record<string, any> = {}) {
    this.networkAdapter?.broadcastControlMessage(type, data)
  }

  /**
   * 广播 UI 同步事件
   */
  broadcastUIEvent(type: UIEventType, data: Record<string, any> = {}) {
    this.networkAdapter?.broadcastUIEvent(type, data)
  }

  /**
   * 注册保存结果监听器
   */
  onSaveResult(listener: (result: SaveResult) => void) {
    return this.subscribe(this.saveListeners, listener)
  }

  /**
   * 注册保存开始监听器
   */
  onSaveStart(listener: () => void) {
    return this.subscribe(this.saveStartListeners, listener)
  }

  /**
   * 销毁管理器
   */
  destroy() {
    if (this.saveTimeout)
      clearTimeout(this.saveTimeout)
    this.saveListeners.clear()
    this.saveStartListeners.clear()
    this.disableCollaboration()
    this.repo = null
    this.handle = null
  }

  // ==================== Getters ====================

  getHandle() {
    return this.handle
  }

  getDoc() {
    return this.handle?.doc() ?? null
  }

  getDocumentUrl() {
    return this.handle?.url ?? null
  }

  getDocumentId() {
    return this.handle?.documentId ?? null
  }

  getCollaborationChannelName() {
    return this.networkAdapter?.getChannelName() ?? null
  }

  getCollaborationSessionId() {
    return this.currentSessionId
  }

  isCollaborating() {
    return !!(this.networkAdapter && this.currentSessionId)
  }

  // ==================== 私有方法 ====================

  private getDocumentInfo() {
    return {
      documentUrl: this.getDocumentUrl(),
      documentId: this.getDocumentId(),
    }
  }

  private syncDocumentInfo() {
    this.networkAdapter?.setLocalDocumentInfo(this.getDocumentInfo())
  }

  private subscribe<T>(listeners: Set<T>, listener: T): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  private notify<T>(listeners: Set<(arg: T) => void>, arg: T): void
  private notify(listeners: Set<() => void>): void
  private notify<T>(listeners: Set<((arg: T) => void) | (() => void)>, arg?: T) {
    listeners.forEach((fn) => {
      try {
        (fn as (arg?: T) => void)(arg)
      }
      catch (err) {
        console.error('⚠️ 监听器执行失败', err)
      }
    })
  }

  private async createNewDocument(): Promise<DocHandle<AutomergeResumeDocument>> {
    const { data: supabaseData, isPermissionError } = await this.persistenceService.loadResumeConfig()

    if (isPermissionError || !supabaseData) {
      this.canPersistToSupabase = false
      const reason = isPermissionError ? '用户无法读取 resume_config' : '未找到 resume_config'
      logger.warn(`${reason}，进入只读协作模式`, { resumeId: this.resumeId })
    }

    const handle = this.repo!.create<AutomergeResumeDocument>()

    handle.change((doc) => {
      doc._metadata = {
        resumeId: this.resumeId,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      if (supabaseData) {
        Object.assign(doc, supabaseData)
      }

      doc.order ||= [...DEFAULT_ORDER]
      doc.visibility ||= { ...DEFAULT_VISIBILITY }
    })

    this.handle = handle
    await handle.whenReady()
    this.syncDocumentInfo()

    if (this.canPersistToSupabase) {
      await this.saveToSupabase(handle)
    }

    return handle
  }

  private async loadFromPersistence(): Promise<DocHandle<AutomergeResumeDocument> | null> {
    const result = await this.persistenceService.loadAutomergeData()
    if (!result)
      return null

    const { documentUrl, binary } = result

    // 优先通过 URL 查找
    if (documentUrl) {
      try {
        const handle = this.repo!.find<AutomergeResumeDocument>(documentUrl as any) as unknown as DocHandle<AutomergeResumeDocument>
        await handle.whenReady()
        if (handle.doc())
          return handle
      }
      catch (err) {
        logger.debug('通过 documentUrl 加载失败，回退到二进制导入', err as any)
      }
    }

    // 从二进制导入
    if (binary?.length) {
      try {
        const handle = this.repo!.import<AutomergeResumeDocument>(binary)
        await handle.whenReady()
        return handle
      }
      catch (err) {
        logger.error('导入二进制数据失败', err as any)
      }
    }

    return null
  }

  async saveToSupabase(handle: DocHandle<AutomergeResumeDocument>) {
    if (!this.canPersistToSupabase) {
      this.notify(this.saveListeners, { success: true })
      return
    }

    this.notify(this.saveStartListeners)

    const result = await this.persistenceService.saveToSupabase(handle)

    if (!result.success && result.isPermissionError) {
      this.canPersistToSupabase = false
      logger.warn('用户无法写入 automerge_documents，切换到只读协作模式', { resumeId: this.resumeId })
    }

    this.notify(this.saveListeners, { success: result.success, error: result.error })
  }

  private scheduleSave() {
    if (this.isInitializing)
      return

    if (this.saveTimeout)
      clearTimeout(this.saveTimeout)

    this.saveTimeout = setTimeout(() => {
      if (this.handle)
        this.saveToSupabase(this.handle)
    }, 3000)
  }
}
