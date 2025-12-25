/**
 * Supabase 网络适配器
 * @module adapters/supabase
 * @description 使用 Supabase Realtime 频道实现 Automerge NetworkAdapter 接口。
 */

import type { Message, PeerId, PeerMetadata } from '@automerge/automerge-repo'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { NetworkAdapter } from '@automerge/automerge-repo'
import { logger } from '@/lib/logger'
import supabase from '@/lib/supabase/client'
import { base64ToUint8Array, uint8ArrayToBase64 } from '../utils'

/**
 * 协作事件回调
 */
export interface CollaborationCallbacks {
  /** 当 peer 加入会话时触发 */
  onPeerJoin?: (payload: { peerId: string, metadata?: Record<string, any> }) => void
  /** 当 peer 离开会话时触发 */
  onPeerLeave?: (payload: { peerId: string }) => void
  /** 当频道成功订阅时触发 */
  onChannelReady?: (channelName: string) => void
  /** 当收到自定义控制消息时触发 */
  onControlMessage?: (payload: { type: string, data?: Record<string, any> }) => void
  /** 当前用户的初始在线元数据 */
  presenceMetadata?: Record<string, any>
}

/**
 * Supabase 网络适配器类
 * @extends NetworkAdapter
 * @description 管理 peer 之间使用 Supabase 频道的实时通信。
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
  private localDocumentId: string | null = null
  private pendingMessages: Array<{ senderId: any, targetId: any, messageType: any, documentId: any, message: string }> = []

  /**
   * 创建一个新的 SupabaseNetworkAdapter
   * @param {string} resumeId - 简历 ID（用于频道范围）
   * @param {string} sessionId - 协作的唯一会话 ID
   * @param {CollaborationCallbacks} callbacks - 事件回调
   */
  constructor(resumeId: string, sessionId: string, callbacks: CollaborationCallbacks = {}) {
    super()
    this.resumeId = resumeId
    this.sessionId = sessionId
    this.callbacks = callbacks
    // 使用 resumeId 作为频道名称的一部分以确保隔离
    this.channelName = `automerge:resume:${this.resumeId}:${this.sessionId}`
    this.presenceMetadata = callbacks.presenceMetadata || {}
  }

  /**
   * 设置本地文档信息
   * @description 将远程消息映射到本地文档 ID。如果有挂起的消息，则刷新它们。
   * @param {object} info - 文档信息
   * @param {string | null} info.documentUrl - Automerge URL
   * @param {string | null} info.documentId - Automerge 文档 ID
   */
  setLocalDocumentInfo({ documentId }: { documentUrl: string | null, documentId: string | null }) {
    this.localDocumentId = documentId

    if (!this.localDocumentId) {
      return
    }

    // 刷新缓存消息 (最大 200)
    const toFlush = this.pendingMessages.splice(0, 200)
    toFlush.forEach(({ senderId, targetId, messageType, documentId, message }) => {
      try {
        const uint8Array = base64ToUint8Array(message)
        const resolvedDocumentId = this.localDocumentId || documentId

        const messageObj: Message = {
          type: messageType || 'message',
          senderId,
          targetId: targetId || this.peerId!,
          data: uint8Array,
        }
        ;(messageObj as any).documentId = resolvedDocumentId
        ;(messageObj as any).channelId = resolvedDocumentId

        logger.automerge.network('刷新缓存消息', {
          originalDocumentId: documentId,
          mappedDocumentId: resolvedDocumentId,
        })

        this.emit('message', messageObj)
      }
      catch {
        // 忽略单个消息错误
      }
    })
  }

  /**
   * 检查适配器是否就绪
   * @returns {boolean} 如果已连接并就绪，则为 True
   */
  isReady(): boolean {
    return this.ready
  }

  /**
   * 等待适配器就绪
   * @returns {Promise<void>} 当就绪时解析
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
   * @param {PeerId} peerId - 本地 peer ID
   * @param {PeerMetadata} peerMetadata - 本地 peer 的元数据
   */
  connect(peerId: PeerId, peerMetadata?: PeerMetadata): void {
    this.peerId = peerId
    this.peerMetadata = peerMetadata

    // 创建频道
    this.channel = supabase.channel(this.channelName, {
      config: {
        broadcast: {
          self: true, // 允许接收自己的消息
          ack: false, // 无需确认以提高性能
        },
      },
    })

    // 监听广播消息
    this.channel.on('broadcast', { event: 'automerge-sync' }, (payload: any) => {
      const { senderId, targetId, messageType, documentId, message } = payload.payload

      logger.automerge.network('收到同步消息', {
        from: senderId,
        to: targetId,
        messageType,
        documentId,
      })

      // 过滤消息
      if (targetId && targetId !== this.peerId) {
        return
      }

      // 如果本地文档 ID 未就绪则缓存
      if (!this.localDocumentId) {
        if (this.pendingMessages.length < 1000) {
          this.pendingMessages.push({ senderId, targetId, messageType, documentId, message })
        }
        logger.automerge.network('localDocumentId 未就绪，消息已缓存', { senderId, targetId })
        return
      }

      const uint8Array = base64ToUint8Array(message)
      const resolvedDocumentId = this.localDocumentId || documentId || this.resumeId

      const messageObj: Message = {
        type: messageType || 'message',
        senderId,
        targetId: targetId || this.peerId!,
        data: uint8Array,
      }
      ;(messageObj as any).documentId = resolvedDocumentId
      ;(messageObj as any).channelId = resolvedDocumentId

      logger.automerge.network('处理同步消息', {
        originalDocumentId: documentId,
        mappedDocumentId: resolvedDocumentId,
      })

      this.emit('message', messageObj)
    })

    // 监听 presence 加入
    this.channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      logger.automerge.collab('新用户加入', { count: newPresences.length })

      newPresences.forEach((presence: any) => {
        const remotePeerId = presence.key || presence.peerId || presence.metadata?.peerId

        if (remotePeerId && String(remotePeerId) !== String(this.peerId)) {
          logger.automerge.collab('发现新 peer', { remotePeerId })

          this.emit('peer-candidate', {
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
      logger.automerge.collab('收到控制消息', { type })

      if (type) {
        this.callbacks.onControlMessage?.({ type, data })
      }
    })

    // 监听 presence 离开
    this.channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach((presence: any) => {
        const remotePeerId = presence.key || presence.peerId || presence.metadata?.peerId

        if (remotePeerId && String(remotePeerId) !== String(this.peerId)) {
          logger.automerge.collab('Peer 离开', { remotePeerId })

          this.emit('peer-disconnected', { peerId: String(remotePeerId) as unknown as PeerId })
          this.callbacks.onPeerLeave?.({ peerId: String(remotePeerId) })
        }
      })
    })

    // 订阅
    this.channel.subscribe(async (status) => {
      logger.automerge.network('频道订阅状态变化', { status, channelName: this.channelName })

      if (status === 'SUBSCRIBED') {
        await this.channel!.track({
          key: String(this.peerId),
          metadata: { ...(peerMetadata || {}), ...this.presenceMetadata, peerId: String(this.peerId) },
          online_at: new Date().toISOString(),
          sessionId: this.sessionId,
        })

        this.ready = true
        logger.automerge.network('Automerge 网络适配器已连接', { channelName: this.channelName, peerId: this.peerId })
        this.callbacks.onChannelReady?.(this.channelName)
      }
    })
  }

  /**
   * 断开频道连接
   */
  disconnect(): void {
    if (this.channel) {
      this.channel.unsubscribe()
      this.channel = null
    }
    this.ready = false
    logger.automerge.network('Automerge 网络适配器已断开', { peerId: this.peerId })
  }

  /**
   * 发送消息给 peers
   * @param {Message} message - 要发送的消息
   */
  send(message: Message): void {
    if (!this.channel || !this.ready) {
      logger.warn('网络适配器未就绪，无法发送消息')
      return
    }

    if (!message.data) {
      return
    }

    const base64Message = uint8ArrayToBase64(message.data)
    const outgoingDocumentId = (message as any).documentId || this.localDocumentId || this.resumeId

    logger.automerge.network('发送同步消息', {
      type: message.type,
      to: message.targetId,
      documentId: outgoingDocumentId,
    })

    this.channel.send({
      type: 'broadcast',
      event: 'automerge-sync',
      payload: {
        senderId: this.peerId,
        targetId: message.targetId,
        messageType: message.type,
        documentId: outgoingDocumentId,
        message: base64Message,
        sessionId: this.sessionId,
      },
    })
  }

  /**
   * 获取当前频道名称
   * @returns {string} 频道名称
   */
  getChannelName(): string {
    return this.channelName
  }

  /**
   * 广播自定义控制消息
   * @param {string} type - 消息类型
   * @param {Record<string, any>} data - 消息负载
   */
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
}
