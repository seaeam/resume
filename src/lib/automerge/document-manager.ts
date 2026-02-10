import type { DocHandle, Repo } from '@automerge/automerge-repo'
import type { AutomergeResumeDocument, ChangeFn } from './schema'
import type { CollaborationCallbacks } from './supabase-network-adapter'
import type { ResumeSchema } from '@/lib/schema'
import type { Suggestion } from '@/pages/optimize/types'
import { next as Automerge } from '@automerge/automerge'
import { set, toPath } from 'lodash'
import { toast } from 'sonner'
import { DEFAULT_ORDER, DEFAULT_VISIBILITY } from '@/lib/schema'
import supabase from '@/lib/supabase/client'
import { getResumeById, updateResumeConfig } from '@/lib/supabase/resume'
import { getCurrentUser } from '@/lib/supabase/user'
import { setLeaf } from '@/pages/optimize/utils'
import { getAutomergeRepo } from './repo'
import { SupabaseNetworkAdapter } from './supabase-network-adapter'

/**
 * 生成确定性的 actor ID，用于确保所有协作者使用相同的文档 URL
 * 使用多轮哈希确保 16 字节全部有效熵
 */
function generateDeterministicActor(resumeId: string): Uint8Array {
  const arr = new Uint8Array(16)
  for (let i = 0; i < 4; i++) {
    // 每轮用不同的前缀生成哈希，确保 4 个字节组各不相同
    const hash = simpleHash(`${i}:${resumeId}`)
    for (let j = 0; j < 4; j++) {
      arr[i * 4 + j] = (hash >> (j * 8)) & 0xFF
    }
  }
  return arr
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash
}

/**
 * 文档管理器
 * 负责文档的创建、加载、保存
 */
export class DocumentManager {
  /**
   * 同步改动到 Automerge 文档
   * @param resumeId 简历ID
   * @param updates 优化建议列表（包含路径和修改后的值）
   * @param options 配置选项
   * @param options.syncToResumeConfig 是否同时同步到 resume_config 表（默认 false）
   */
  static async syncAutomergeDocument(
    resumeId: string,
    updates: Suggestion[],
    options: { syncToResumeConfig?: boolean } = {},
  ) {
    const validSuggestions = updates?.filter(s => s?.locate?.path) || []

    if (validSuggestions.length === 0) {
      return
    }

    const user = await getCurrentUser()

    if (!user) {
      return
    }

    // 1. 同步到 Automerge 文档
    const manager = new DocumentManager(resumeId, user.id)
    const handle = await manager.initialize()

    manager.change((doc) => {
      validSuggestions.forEach((s) => {
        setLeaf(doc, toPath(s.locate.path), s.after)
      })
    })

    await manager.saveToSupabase(handle)

    // 2. 如果开启选项，同步到 resume_config
    if (options.syncToResumeConfig) {
      try {
        const resume_config = await getResumeById(resumeId)

        validSuggestions.forEach((s) => {
          // 这里使用 lodash.set 修改普通对象
          set(resume_config, s.locate.path, s.after)
        })

        await updateResumeConfig(resumeId, resume_config)
      }
      catch (error) {
        toast.error(`Failed to sync to resume_config：${error}`)
      }
    }
  }

  private handle: DocHandle<AutomergeResumeDocument> | null = null
  private resumeId: string
  private userId: string
  private repo: Repo | null = null
  private networkAdapter: SupabaseNetworkAdapter | null = null
  private currentSessionId: string | null = null
  private saveListeners = new Set<(result: { success: boolean, error?: unknown }) => void>()
  private saveStartListeners = new Set<() => void>()
  private canPersistToSupabase = true
  private sharedDocumentUrl?: string

  constructor(resumeId: string, userId: string, options?: { sharedDocumentUrl?: string }) {
    this.resumeId = resumeId
    this.userId = userId
    this.sharedDocumentUrl = options?.sharedDocumentUrl
    if (this.sharedDocumentUrl) {
      this.canPersistToSupabase = false
    }
  }

  /**
   * 初始化文档
   * 1. 尝试从 Supabase 加载现有文档（优先使用 metadata 中的 documentUrl，其次使用二进制数据）
   * 2. 如果不存在，创建新文档并保存 URL
   */
  async initialize() {
    const repo = getAutomergeRepo(this.userId, this.resumeId)
    this.repo = repo

    if (this.sharedDocumentUrl) {
      const sharedHandle = await this.loadFromDocumentUrl(repo, this.sharedDocumentUrl)
      if (sharedHandle) {
        this.handle = sharedHandle
        this.networkAdapter?.setLocalDocumentInfo({
          documentUrl: this.getDocumentUrl(),
          documentId: this.getDocumentId(),
        })
        return sharedHandle
      }
    }

    // 尝试从 Supabase 加载现有的 Automerge 文档
    const existingHandle = await this.loadFromSupabaseAutomerge(repo)
    if (existingHandle) {
      this.handle = existingHandle
      this.networkAdapter?.setLocalDocumentInfo({
        documentUrl: this.getDocumentUrl(),
        documentId: this.getDocumentId(),
      })
      return existingHandle
    }

    // 从 Supabase resume_config 表加载数据
    const supabaseData = await this.loadFromSupabaseConfig()

    // 创建新的 Automerge 文档
    // repo.create() 会生成正确格式的 Automerge DocumentId
    const handle = repo.create<any>({ actor: generateDeterministicActor(this.resumeId) })

    handle.change((doc) => {
      // 初始化元数据
      doc._metadata = {
        resumeId: this.resumeId,
        userId: this.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
      }

      // 复制 Supabase 数据到 Automerge 文档
      if (supabaseData) {
        Object.assign(doc, supabaseData)
      }

      // 确保 order 和 visibility 有默认值
      if (!doc.order || doc.order.length === 0) {
        doc.order = [...DEFAULT_ORDER] as any
      }
      if (!doc.visibility) {
        doc.visibility = { ...DEFAULT_VISIBILITY } as any
      }
    })

    this.handle = handle

    // 等待文档就绪
    await handle.whenReady()

    this.networkAdapter?.setLocalDocumentInfo({
      documentUrl: this.getDocumentUrl(),
      documentId: this.getDocumentId(),
    })

    // 立即保存到 Supabase（将 documentUrl 写入 metadata），确保其他窗口能加载到相同的文档
    if (this.canPersistToSupabase) {
      await this.saveToSupabase(handle)
    }

    return handle
  }

  /**
   * 从 Supabase automerge_documents 表加载文档
   */
  private async loadFromSupabaseAutomerge(repo: Repo): Promise<DocHandle<AutomergeResumeDocument> | null> {
    try {
      // 注意：Supabase 会自动将 BYTEA 转换为合适的格式
      // 使用 maybeSingle() 而不是 single() 来避免 PGRST116 错误的特殊处理
      const { data, error } = await supabase
        .from('automerge_documents')
        .select('document_data, metadata')
        .eq('resume_id', this.resumeId)
        .maybeSingle()

      if (error) {
        // 如果是找不到记录的错误，这是正常的
        if (error.code === 'PGRST116') {
          return null
        }

        return null
      }

      if (!data) {
        return null
      }

      const metadata = (data.metadata as Record<string, any> | null) || {}
      const documentUrl = typeof metadata.documentUrl === 'string' ? metadata.documentUrl : undefined

      // 优先尝试使用 documentUrl 通过 repo.find 加载
      // 这样如果文档已经在 IndexedDB 中，可以直接使用，保持同一个 handle 实例
      if (documentUrl) {
        try {
          // 先尝试 find（可能已经在 IndexedDB 中）
          const handle = await repo.find<AutomergeResumeDocument>(documentUrl as any)

          if (handle) {
            await handle.whenReady()
            return handle
          }
        }
        catch (err) {
          console.warn('[DocumentManager] repo.find by documentUrl failed, falling back to binary import:', err)
        }
      }

      // 使用二进制数据导入
      if (!data.document_data) {
        return null
      }

      // 使用统一的解码方法将各种格式转为 Uint8Array
      const uint8Array = this.decodeDocumentData(data.document_data)
      if (!uint8Array) {
        return null
      }

      // 使用 repo.import 导入已有的 Automerge 文档
      // 这样不会触发 create 导致的循环保存
      const handle = repo.import<AutomergeResumeDocument>(uint8Array)

      // 等待文档就绪
      await handle.whenReady()

      return handle
    }
    catch (err) {
      console.warn('[DocumentManager] loadFromSupabaseAutomerge failed:', err)
      return null
    }
  }

  private async loadFromDocumentUrl(
    repo: Repo,
    documentUrl: string,
  ): Promise<DocHandle<AutomergeResumeDocument> | null> {
    try {
      const handle = await repo.find<AutomergeResumeDocument>(documentUrl as any)
      if (handle) {
        await handle.whenReady()
        return handle
      }
    }
    catch (err) {
      console.warn('[DocumentManager] loadFromDocumentUrl failed:', err)
    }
    return null
  }

  /**
   * 从 Supabase resume_config 表加载简历数据
   */
  private async loadFromSupabaseConfig(): Promise<Partial<ResumeSchema> | null> {
    const { data, error } = await supabase
      .from('resume_config')
      .select('*')
      .eq('resume_id', this.resumeId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42501') {
        // 没有权限读取该简历或不存在，进入只读模式（依赖实时协作拉取数据）
        this.canPersistToSupabase = false
        return null
      }

      return null
    }

    if (!data) {
      this.canPersistToSupabase = false
      return null
    }

    // 移除数据库特有字段
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

    return resumeData
  }

  /**
   * 将 Uint8Array 转换为 Base64 字符串
   * 使用分块处理避免大数组导致栈溢出
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    const CHUNK_SIZE = 0x8000 // 32KB chunks
    let binary = ''
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      const chunk = bytes.subarray(i, i + CHUNK_SIZE)
      binary += String.fromCharCode.apply(null, chunk as unknown as number[])
    }
    return btoa(binary)
  }

  /**
   * 保存文档快照到 Supabase
   */
  async saveToSupabase(handle: DocHandle<AutomergeResumeDocument>) {
    const doc = handle.doc()
    if (!doc)
      return

    const binary = Automerge.save(doc)
    const heads = Automerge.getHeads(doc)

    // 将 Uint8Array 转换为 Base64，因为 Supabase 的 BYTEA 处理有问题
    // 使用分块处理避免大数组导致栈溢出
    const base64 = this.uint8ArrayToBase64(binary)

    // 获取文档 URL（用于协作）
    const documentUrl = handle.url

    if (!this.canPersistToSupabase) {
      this.notifySaveListeners({ success: true })
      return
    }

    this.notifySaveStart()

    const { error } = await supabase.from('automerge_documents').upsert(
      {
        resume_id: this.resumeId,
        user_id: this.userId,
        document_data: base64, // 保存为 Base64 字符串
        heads,
        document_version: doc._metadata.version,
        change_count: 0,
        updated_at: new Date().toISOString(),
        metadata: {
          ...(doc._metadata ? { docMetadata: doc._metadata } : {}),
          documentUrl,
        },
      },
      {
        onConflict: 'resume_id', // 指定冲突字段
      },
    )

    if (error) {
      // 如果是 RLS/权限问题（例如 42501），切换到只读协作模式以避免以后重复失败
      if ((error as any)?.code === '42501' || (error as any)?.status === 403) {
        this.canPersistToSupabase = false
      }
      this.notifySaveListeners({ success: false, error })
    }
    else {
      this.notifySaveListeners({ success: true })
    }
  }

  onSaveResult(listener: (result: { success: boolean, error?: unknown }) => void): () => void {
    this.saveListeners.add(listener)
    return () => {
      this.saveListeners.delete(listener)
    }
  }

  onSaveStart(listener: () => void): () => void {
    this.saveStartListeners.add(listener)
    return () => {
      this.saveStartListeners.delete(listener)
    }
  }

  private notifySaveListeners(result: { success: boolean, error?: unknown }) {
    this.saveListeners.forEach((listener) => {
      try {
        listener(result)
      }
      catch (err) {
        console.warn('[DocumentManager] saveListener threw:', err)
      }
    })
  }

  private notifySaveStart() {
    this.saveStartListeners.forEach((listener) => {
      try {
        listener()
      }
      catch (err) {
        console.warn('[DocumentManager] saveStartListener threw:', err)
      }
    })
  }

  /**
   * 将各种格式的 document_data 解码为 Uint8Array
   */
  private decodeDocumentData(raw: unknown): Uint8Array | null {
    try {
      if (raw instanceof Uint8Array)
        return raw
      if (Array.isArray(raw))
        return new Uint8Array(raw)
      if (typeof raw === 'string') {
        const toDecode = raw.startsWith('\\x')
          ? Array.from({ length: (raw.length - 2) / 2 }, (_, i) =>
              String.fromCharCode(Number.parseInt(raw.slice(2 + i * 2, 4 + i * 2), 16))).join('')
          : raw
        const binaryString = atob(toDecode)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        return bytes
      }
    }
    catch (err) {
      console.warn('[DocumentManager] decodeDocumentData failed:', err)
    }
    return null
  }

  async enableCollaboration(sessionId: string, callbacks: CollaborationCallbacks = {}) {
    if (!this.repo) {
      throw new Error('Automerge repo 尚未初始化')
    }

    if (this.networkAdapter && this.currentSessionId === sessionId) {
      return this.networkAdapter
    }

    // 如果已有其他会话，先清理
    if (this.networkAdapter) {
      this.disableCollaboration()
    }

    // 准备开启协作：优先从 Supabase automerge_documents 表加载已有的二进制快照与 metadata
    // 以 resumeId 为唯一键，确保不同协作者基于相同快照开始协作，避免各自新建本地文档

    // repo 已经在 initialize 中创建过，断言其存在以便在后面的异步任务中使用
    const repo = this.repo as Repo

    // 先创建 adapter 并注册，但本地文档信息由下面的异步任务补充（如果数据库里有内容）
    const adapter = new SupabaseNetworkAdapter(this.resumeId, sessionId, callbacks)
    // 先使用现有的本地 document 信息（如果已经有 handle）
    adapter.setLocalDocumentInfo({
      documentUrl: this.getDocumentUrl(),
      documentId: this.getDocumentId(),
    })
    this.repo.networkSubsystem.addNetworkAdapter(adapter)
    this.networkAdapter = adapter
    this.currentSessionId = sessionId

    // 异步尝试从 Supabase 加载 automerge 文档快照并在可用时导入/映射
    // 注意：如果已经有 handle（例如发起者），不要导入数据库快照，让网络同步处理
    // 使用 await 确保加载完成后再返回 adapter，避免竞态条件
    const loadTask = (async () => {
      try {
        // 如果已经有 handle，跳过导入，让网络同步处理
        if (this.handle) {
          adapter.setLocalDocumentInfo({
            documentUrl: this.getDocumentUrl(),
            documentId: this.getDocumentId(),
          })
          return
        }

        const { data, error } = await supabase
          .from('automerge_documents')
          .select('document_data, metadata')
          .eq('resume_id', this.resumeId)
          .maybeSingle()

        if (error) {
          console.warn('[DocumentManager] enableCollaboration load error:', error.message)
          return
        }

        if (!data)
          return

        const metadata = (data.metadata as Record<string, any> | null) || {}
        const metadataDocumentUrl = typeof metadata.documentUrl === 'string' ? metadata.documentUrl : undefined

        // 如果数据库包含二进制数据，尝试导入为本地 handle
        if (data.document_data) {
          const uint8Array = this.decodeDocumentData(data.document_data)

          if (uint8Array && uint8Array.length > 0) {
            try {
              const imported = repo.import<AutomergeResumeDocument>(uint8Array)
              await imported.whenReady()
              if (!this.handle) {
                this.handle = imported
              }
            }
            catch (err) {
              console.warn('[DocumentManager] import document failed:', err)
            }
          }
        }

        // 最终确定适配器的本地文档信息（优先使用当前 handle.url，再用 metadata 中的 documentUrl）
        const finalLocalUrl = this.getDocumentUrl() || metadataDocumentUrl || null
        adapter.setLocalDocumentInfo({
          documentUrl: finalLocalUrl,
          documentId: this.getDocumentId(),
        })
      }
      catch (err) {
        console.warn('[DocumentManager] enableCollaboration async task failed:', err)
      }
    })()

    // 等待异步加载完成，避免返回 adapter 时还未初始化
    void loadTask

    return adapter
  }

  disableCollaboration() {
    if (this.repo && this.networkAdapter) {
      this.repo.networkSubsystem.removeNetworkAdapter(this.networkAdapter)
      this.networkAdapter = null
    }
    this.currentSessionId = null
  }

  getCollaborationChannelName(): string | null {
    return this.networkAdapter?.getChannelName() ?? null
  }

  getCollaborationSessionId(): string | null {
    return this.currentSessionId
  }

  broadcastCollaborationEvent(type: string, data: Record<string, any> = {}) {
    this.networkAdapter?.broadcastControlMessage(type, data)
  }

  /**
   * 获取当前文档句柄
   */
  getHandle(): DocHandle<AutomergeResumeDocument> | null {
    return this.handle
  }

  getDocumentUrl(): string | null {
    return this.handle?.url ?? this.sharedDocumentUrl ?? null
  }

  getDocumentId(): string | null {
    return this.handle?.documentId ?? null
  }

  /**
   * 获取当前文档快照
   */
  getDoc(): AutomergeResumeDocument | null {
    return this.handle?.doc() || null
  }

  /**
   * 更新文档
   */
  change(changeFn: ChangeFn<AutomergeResumeDocument>) {
    if (!this.handle) {
      return
    }

    this.handle.change((doc) => {
      changeFn(doc)
      // 更新元数据
      doc._metadata.updatedAt = new Date().toISOString()
      doc._metadata.version += 1
    })

    // 注意：保存调度由 form.ts 的 onSaveResult 回调链统一管理，
    // 不再在此处触发 debouncedSave，避免与 form.ts 的 syncToSupabase 产生双重保存冲突。
  }

  /**
   * 销毁文档管理器
   */
  destroy() {
    this.saveListeners.clear()
    this.saveStartListeners.clear()
    this.disableCollaboration()
    this.repo = null
    this.handle = null
  }
}
