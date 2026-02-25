import type { Message, PeerId, PeerMetadata } from '@automerge/automerge-repo'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { NetworkAdapter } from '@automerge/automerge-repo'
import supabase from '@/lib/supabase/client'

export interface CollaborationCallbacks {
  onPeerJoin?: (payload: { peerId: string, metadata?: Record<string, any> }) => void
  onPeerLeave?: (payload: { peerId: string }) => void
  onChannelReady?: (channelName: string) => void
  onControlMessage?: (payload: { type: string, data?: Record<string, any> }) => void
  presenceMetadata?: Record<string, any>
}

/**
 * Supabase Realtime Network Adapter for Automerge
 * 使用 Supabase Realtime 作为 Automerge 的网络传输层，并允许按会话隔离协作。
 */
export class SupabaseNetworkAdapter extends NetworkAdapter {
  private channel: RealtimeChannel | null = null
  peerId?: PeerId = undefined
  peerMetadata?: PeerMetadata = undefined
  private readonly resumeId: string
  private readonly sessionId: string
  private readonly callbacks: CollaborationCallbacks
  private readonly channelName: string
  private readonly presenceMetadata: Record<string, any>
  private ready = false
  // 本地 documentUrl（handle.url），用于在接收消息时将来自网络的 documentId 映射到本地 handle
  private localDocumentUrl: string | null = null
  private localDocumentId: string | null = null
  // 收到但尚未分派到本地文档的消息缓存（当本地文档信息未知时使用）
  private pendingMessages: Array<{ senderId: any, targetId: any, messageType: any, documentId: any, message: string, timestamp: number }>
    = []
  /** 待处理消息的过期时间（30秒），防止长期积压陈旧消息 */
  private static readonly PENDING_MESSAGE_TTL = 30_000

  /**
   * note: 使用 resumeId 而不是文档本地 URL 来生成频道名，resumeId 在不同浏览器/设备上是稳定的
   */
  constructor(resumeId: string, sessionId: string, callbacks: CollaborationCallbacks = {}) {
    super()
    this.resumeId = resumeId
    this.sessionId = sessionId
    this.callbacks = callbacks
    // 使用 resumeId 作为频道标识的一部分，保证不同浏览器加入相同的频道
    this.channelName = `automerge:resume:${this.resumeId}:${this.sessionId}`
    this.presenceMetadata = callbacks.presenceMetadata || {}
  }

  /**
   * 设置本地文档信息（Automerge handle.url + documentId），用于将远端消息映射到本地文档
   */
  setLocalDocumentInfo({ documentUrl, documentId }: { documentUrl: string | null, documentId: string | null }) {
    this.localDocumentUrl = documentUrl
    this.localDocumentId = documentId
    if (this.localDocumentId) {
      // 冲刷队列（最多 200 条以防内存泄漏）
      const toFlush = this.pendingMessages.splice(0, 200)
      toFlush.forEach(({ senderId, targetId, messageType, documentId, message }) => {
        try {
          const uint8Array = this.base64ToUint8Array(message)
          const resolvedDocumentId = this.localDocumentId || documentId
          const messageObj: Message = {
            type: messageType || 'message',
            senderId,
            targetId: targetId || this.peerId!,
            data: uint8Array,
          }
          // 设置消息的 documentId 和 channelId
          ;(messageObj as any).documentId = resolvedDocumentId
          ;(messageObj as any).channelId = resolvedDocumentId

          // 发给 repo
          this.emit('message', messageObj)
        }
        catch {
          // ignore individual message errors
        }
      })
    }
  }

  /**
   * 网络适配器是否就绪
   */
  isReady(): boolean {
    return this.ready
  }

  /**
   * 等待网络适配器就绪
   */
  whenReady(): Promise<void> {
    if (this.ready) {
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      const off = () => {
        this.off('peer-candidate', handlePeerCandidate)
        this.off('close', off)
        resolve()
      }

      this.once('peer-candidate', handlePeerCandidate)

      function handlePeerCandidate() {
        off()
      }

      this.once('close', off)
    })
  }

  /**
   * 连接到 Supabase Realtime 频道
   */
  connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {
    this.peerId = peerId
    this.peerMetadata = peerMetadata

    // 创建频道，使用 resumeId + sessionId 作为房间名，确保每次分享都是独立会话
    this.channel = supabase.channel(this.channelName)

    // 监听其他 peer 的消息
    this.channel.on('broadcast', { event: 'automerge-sync' }, (payload: any) => {
      const { senderId, targetId, messageType, documentId, message } = payload.payload

      // 只处理发给自己的消息或广播消息
      if (targetId && targetId !== this.peerId)
        return

      // 如果本地文档信息还未就绪，则缓存消息，等待 setLocalDocumentInfo 时冲刷
      if (!this.localDocumentId) {
        // 限制队列长度，并清理过期消息
        const now = Date.now()
        this.pendingMessages = this.pendingMessages.filter(
          m => now - m.timestamp < SupabaseNetworkAdapter.PENDING_MESSAGE_TTL,
        )
        if (this.pendingMessages.length < 1000) {
          this.pendingMessages.push({ senderId, targetId, messageType, documentId, message, timestamp: now })
        }

        return
      }

      const uint8Array = this.base64ToUint8Array(message)

      const messageObj: Message = {
        type: messageType || 'message',
        senderId,
        targetId: targetId || this.peerId!,
        data: uint8Array,
      }

      const resolvedDocumentId = this.localDocumentId || documentId || this.resumeId

      // 设置消息的 documentId 和 channelId，优先映射到本地文档 URL
      ;(messageObj as any).documentId = resolvedDocumentId
      ;(messageObj as any).channelId = resolvedDocumentId

      this.emit('message', messageObj)
    })

    // 监听 peer 加入
    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach((presence: any) => {
        // Supabase presence 的结构可能包含 key、session_id、metadata 等
        const remotePeerId = presence.key || presence.peerId || presence.metadata?.peerId

        if (remotePeerId && String(remotePeerId) !== String(this.peerId)) {
          this.emit('peer-candidate', {
            // PeerId 在类型上是一个品牌类型，做简单断言以兼容外部字符串
            peerId: String(remotePeerId) as unknown as PeerId,
            peerMetadata: presence.metadata || {},
          })

          this.callbacks.onPeerJoin?.({
            peerId: String(remotePeerId),
            metadata: presence.metadata || {},
          })
        }
      })
    })

    // 监听控制消息
    this.channel.on('broadcast', { event: 'automerge-control' }, (payload: any) => {
      const { type, data } = payload.payload || {}

      if (type) {
        this.callbacks.onControlMessage?.({ type, data })
      }
    })

    // 监听 peer 离开
    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        const remotePeerId = presence.key || presence.peerId || presence.metadata?.peerId

        if (remotePeerId && String(remotePeerId) !== String(this.peerId)) {
          this.emit('peer-disconnected', { peerId: String(remotePeerId) as unknown as PeerId })
          this.callbacks.onPeerLeave?.({ peerId: String(remotePeerId) })
        }
      })
    })

    // 订阅频道
    this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // 使用 peerId 字段标识当前 peer，避免与 Supabase 内部的 key 字段冲突
        await this.channel!.track({
          peerId: String(this.peerId),
          metadata: { ...(peerMetadata || {}), ...this.presenceMetadata, peerId: String(this.peerId) },
          online_at: new Date().toISOString(),
          sessionId: this.sessionId,
        })

        this.ready = true

        this.callbacks.onChannelReady?.(this.channelName)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
    this.ready = false
  }

  /**
   * 发送消息给其他 peer
   */
  send(message: Message): void {
    if (!this.channel || !this.ready) {
      return
    }

    if (!message.data) {
      return
    }

    const base64Message = this.uint8ArrayToBase64(message.data)

    // 优先使用 message 中携带的 documentId（通常由 automerge-repo 提供），若不存在则使用本地 known documentUrl，最后回退到 resumeId
    const outgoingDocumentId = (message as any).documentId || this.localDocumentId || this.resumeId

    this.channel.send({
      type: 'broadcast',
      event: 'automerge-sync',
      payload: {
        senderId: this.peerId,
        targetId: message.targetId,
        messageType: message.type,
        // 发送 resumeId 作为 documentId，确保频道内所有客户端都能识别这是同一个业务文档
        documentId: outgoingDocumentId,
        message: base64Message,
        sessionId: this.sessionId,
      },
    })
  }

  getChannelName() {
    return this.channelName
  }

  broadcastControlMessage(type: string, data: Record<string, any> = {}) {
    if (!this.channel)
      return

    this.channel.send({
      type: 'broadcast',
      event: 'automerge-control',
      payload: {
        type,
        data,
        senderId: this.peerId,
        sessionId: this.sessionId,
      },
    })
  }

  /**
   * Uint8Array 转 Base64
   * 使用分块处理避免大数组导致栈溢出
   */
  private uint8ArrayToBase64(uint8Array: Uint8Array): string {
    const CHUNK_SIZE = 0x8000 // 32KB chunks
    let binary = ''
    for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
      const chunk = uint8Array.subarray(i, i + CHUNK_SIZE)
      binary += String.fromCharCode.apply(null, chunk as unknown as number[])
    }
    return btoa(binary)
  }

  /**
   * Base64 转 Uint8Array
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64)
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
    return uint8Array
  }
}
