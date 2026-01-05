import type { CollaborationCallbacks, UIEventPayload, UIEventType } from '@/lib/automerge'
import { toast } from 'sonner'
import { create } from 'zustand'
import { securityLogger } from '@/lib/collaboration/collaboration-security-logger'
import { collaborationSessionService } from '@/lib/collaboration/collaboration-session-service'
import {
  clearStoredSession,
  isSessionInvalidated,
  markAllSessionsAsInvalidated,
  markSessionAsInvalidated,
  rememberSessionRole,
} from '@/lib/collaboration/session-storage'
import { logger } from '@/lib/logger'
import useResumeStore from '@/store/resume/form'

type CollaborationRole = 'host' | 'guest'

interface Participant {
  peerId: string
  metadata?: Record<string, any>
  joinedAt: number
}

interface StartShareParams {
  resumeId: string
  userId: string
  userName: string
}

interface JoinShareParams extends StartShareParams {
  sessionId: string
}

/**
 * 会话验证结果
 */
interface SessionValidationResult {
  isValid: boolean
  errorCode?: string
  errorMessage?: string
}

/**
 * UI 事件监听器
 */
type UIEventListener = (payload: UIEventPayload) => void

interface CollaborationState {
  isSharing: boolean
  isConnecting: boolean
  role: CollaborationRole | null
  sessionId: string | null
  shareUrl: string | null
  channelName: string | null
  resumeId: string | null
  roomName: string | null
  participants: Record<string, Participant>
  error: string | null
  selfPeerId: string | null
  selfColor: string | null
  selfUserId: string | null
  shareEndedByRemote: boolean

  // 会话验证相关
  sessionValidationError: string | null
  isSessionValid: boolean

  // UI 事件监听器
  uiEventListeners: Set<UIEventListener>

  startSharing: (params: StartShareParams) => Promise<void>
  joinSession: (params: JoinShareParams) => Promise<void>
  resumeHosting: (params: JoinShareParams) => Promise<void>
  stopSharing: (options?: { silent?: boolean }) => void
  handleRemoteShareEnd: () => void
  acknowledgeRemoteShareEnd: () => void

  // 会话验证方法
  validateSession: (params: { sessionId: string, resumeId: string, userId: string }) => SessionValidationResult
  invalidateCurrentSession: () => void

  // UI 事件相关方法
  broadcastUIEvent: (type: UIEventType, data: Record<string, any>) => void
  subscribeUIEvent: (listener: UIEventListener) => () => void
}

/**
 * 生成协作参与者颜色
 */
function generateParticipantColor() {
  const hue = Math.floor(Math.random() * 360)
  return `hsl(${hue}, 85%, 65%)`
}

/**
 * 生成会话ID
 */
function createSessionId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    }
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buffer = new Uint8Array(12)
      crypto.getRandomValues(buffer)
      return Array.from(buffer, byte => byte.toString(36)[0]).join('').slice(0, 16)
    }
  }
  catch {
    // ignore
  }
  return Math.random().toString(36).slice(2, 18)
}

/**
 * 构建分享URL
 */
function buildShareUrl(resumeId: string, sessionId: string) {
  const url = new URL(`${window.location.origin}/resume/editor`)
  url.searchParams.set('resumeId', resumeId)
  url.searchParams.set('collabSession', sessionId)
  return url.toString()
}

/**
 * 构建房间名称
 */
function buildRoomName(resumeId: string, sessionId: string) {
  return `resume-collab:${resumeId}:${sessionId}`
}

/**
 * 创建协作回调配置 - 统一的逻辑提取
 */
function createCollaborationCallbacks(params: {
  role: CollaborationRole
  userId: string
  userName: string
  color: string
  get: () => CollaborationState
  set: (state: Partial<CollaborationState> | ((state: CollaborationState) => Partial<CollaborationState>)) => void
  adapterPeerIdRef: { current: string | null }
}): CollaborationCallbacks {
  const { role, userId, userName, color, get, set, adapterPeerIdRef } = params

  return {
    presenceMetadata: { userId, userName, color, role },

    onChannelReady: (channelName) => {
      set({ channelName })
    },

    onPeerJoin: ({ peerId, metadata }) => {
      if (peerId === adapterPeerIdRef.current)
        return

      const displayName = metadata?.userName || metadata?.name || `协作者 ${peerId.slice(-4)}`
      toast.success(`${displayName} 加入协作`, { description: '已同步最新内容' })

      set(state => ({
        participants: {
          ...state.participants,
          [peerId]: { peerId, metadata, joinedAt: Date.now() },
        },
      }))
    },

    onPeerLeave: ({ peerId }) => {
      set((state) => {
        const updated = { ...state.participants }
        delete updated[peerId]
        return { participants: updated }
      })

      if (peerId !== adapterPeerIdRef.current) {
        toast.info('协作者已离开', { description: `Peer ${peerId.slice(-4)}` })
      }
    },

    onControlMessage: ({ type }) => {
      if (type === 'share-ended' && get().role !== 'host') {
        get().handleRemoteShareEnd()
      }
    },

    onUIEvent: (payload) => {
      logger.automerge.collab('收到远程 UI 事件', payload)
      // 通知所有订阅者
      const listeners = get().uiEventListeners
      listeners.forEach((listener) => {
        try {
          listener(payload)
        }
        catch (err) {
          logger.error('UI 事件监听器执行失败', err as any)
        }
      })
    },
  }
}

/**
 * 通用的协作启用逻辑
 */
async function enableCollaboration(params: {
  sessionId: string
  resumeId: string
  userId: string
  userName: string
  role: CollaborationRole
  shouldSaveSnapshot?: boolean
  get: () => CollaborationState
  set: (state: Partial<CollaborationState> | ((state: CollaborationState) => Partial<CollaborationState>)) => void
}) {
  const { sessionId, resumeId, userId, userName, role, shouldSaveSnapshot = false, get, set } = params

  const docManager = useResumeStore.getState().docManager
  if (!docManager) {
    throw new Error('文档尚未初始化，无法开启协作')
  }

  const color = get().selfColor ?? generateParticipantColor()
  set({ isConnecting: true, error: null, selfColor: color })

  const adapterPeerIdRef = { current: null as string | null }
  const callbacks = createCollaborationCallbacks({
    role,
    userId,
    userName,
    color,
    get,
    set,
    adapterPeerIdRef,
  })

  const adapter = await docManager.enableCollaboration(sessionId, callbacks)
  adapterPeerIdRef.current = adapter.peerId || null

  // 发起者保存最新快照到数据库
  if (shouldSaveSnapshot && docManager.getHandle()) {
    await docManager.saveToSupabase(docManager.getHandle()!)
  }

  const shareUrl = buildShareUrl(resumeId, sessionId)
  const roomName = buildRoomName(resumeId, sessionId)

  set({
    isSharing: true,
    isConnecting: false,
    role,
    sessionId,
    shareUrl,
    resumeId,
    roomName,
    participants: adapterPeerIdRef.current
      ? {
          [adapterPeerIdRef.current]: {
            peerId: adapterPeerIdRef.current,
            metadata: { userId, userName, color, role },
            joinedAt: Date.now(),
          },
        }
      : {},
    selfPeerId: adapterPeerIdRef.current,
    selfUserId: userId,
    error: null,
    shareEndedByRemote: false,
    isSessionValid: true,
    sessionValidationError: null,
  })

  rememberSessionRole({ sessionId, resumeId, userId, role })

  // 记录协作开始的安全日志
  securityLogger.logCollaborationStarted({
    sessionId,
    resumeId,
    userId,
    role,
  })
}

const useCollaborationStore = create<CollaborationState>()((set, get) => ({
  isSharing: false,
  isConnecting: false,
  role: null,
  sessionId: null,
  shareUrl: null,
  channelName: null,
  resumeId: null,
  roomName: null,
  participants: {},
  error: null,
  selfPeerId: null,
  selfColor: null,
  selfUserId: null,
  shareEndedByRemote: false,
  sessionValidationError: null,
  isSessionValid: true,
  uiEventListeners: new Set<UIEventListener>(),

  /**
   * 验证会话是否有效
   */
  validateSession: ({ sessionId, resumeId, userId }) => {
    // 首先检查本地存储的失效标记
    if (isSessionInvalidated(sessionId, resumeId)) {
      const errorMessage = '协作链接已失效，发起者已关闭实时协作'

      securityLogger.logLinkValidation({
        sessionId,
        resumeId,
        userId,
        success: false,
        validationResult: 'SESSION_INVALIDATED_LOCAL',
      })

      set({
        sessionValidationError: errorMessage,
        isSessionValid: false,
      })

      return {
        isValid: false,
        errorCode: 'SESSION_INVALIDATED',
        errorMessage,
      }
    }

    // 使用会话服务进行验证
    const result = collaborationSessionService.validateSession({
      sessionId,
      resumeId,
      userId,
      isHost: false,
    })

    if (!result.isValid) {
      set({
        sessionValidationError: result.errorMessage || '会话验证失败',
        isSessionValid: false,
      })

      return {
        isValid: false,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
      }
    }

    set({
      sessionValidationError: null,
      isSessionValid: true,
    })

    return { isValid: true }
  },

  /**
   * 使当前会话失效（立即失效所有相关链接）
   */
  invalidateCurrentSession: () => {
    const { sessionId, resumeId, selfUserId, role } = get()

    if (!sessionId || !resumeId || !selfUserId) {
      return
    }

    // 只有 host 可以失效会话
    if (role !== 'host') {
      logger.warn('只有协作发起者才能失效会话')
      return
    }

    // 使会话失效
    collaborationSessionService.invalidateSession({
      sessionId,
      resumeId,
      userId: selfUserId,
      reason: 'host_closed',
    })

    // 同时失效该简历的所有历史会话（确保旧链接也无法使用）
    markAllSessionsAsInvalidated({
      resumeId,
      reason: 'host_closed',
    })

    logger.automerge.collab('会话已失效，所有相关链接不再可用', { sessionId, resumeId })
  },

  broadcastUIEvent: (type, data) => {
    const docManager = useResumeStore.getState().docManager
    if (!docManager || !get().isSharing) {
      return
    }
    logger.automerge.collab('广播 UI 事件', { type, data })
    docManager.broadcastUIEvent(type, data)
  },

  subscribeUIEvent: (listener) => {
    const listeners = get().uiEventListeners
    listeners.add(listener)
    set({ uiEventListeners: new Set(listeners) })
    return () => {
      listeners.delete(listener)
      set({ uiEventListeners: new Set(listeners) })
    }
  },

  startSharing: async ({ resumeId, userId, userName }) => {
    const existingSession = get().sessionId
    if (existingSession) {
      get().stopSharing({ silent: true })
    }

    const sessionId = createSessionId()
    logger.automerge.collab('开启协作会话', { sessionId, resumeId })

    // 创建会话记录（用于验证）
    collaborationSessionService.createSession({
      sessionId,
      resumeId,
      hostUserId: userId,
    })

    try {
      await enableCollaboration({
        sessionId,
        resumeId,
        userId,
        userName,
        role: 'host',
        shouldSaveSnapshot: true,
        get,
        set,
      })

      toast.success('已开启实时协作', { description: '现在可以将链接分享给他人了' })
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '开启协作失败'
      set({ isConnecting: false, error: message })
      toast.error(message)
      throw error
    }
  },

  joinSession: async ({ sessionId, resumeId, userId, userName }) => {
    if (get().sessionId === sessionId && get().isSharing) {
      return
    }

    logger.automerge.collab('加入协作会话', { sessionId, resumeId })

    // 验证会话是否有效（安全检查）
    const validationResult = get().validateSession({ sessionId, resumeId, userId })
    if (!validationResult.isValid) {
      const errorMessage = validationResult.errorMessage || '协作链接已失效'

      securityLogger.logLinkAccess({
        sessionId,
        resumeId,
        userId,
        success: false,
        reason: validationResult.errorCode,
        details: { attemptedAction: 'join' },
      })

      set({
        isConnecting: false,
        error: errorMessage,
        sessionValidationError: errorMessage,
        isSessionValid: false,
      })
      toast.error('无法加入协作', { description: errorMessage })
      throw new Error(errorMessage)
    }

    try {
      // 记录访问
      collaborationSessionService.recordAccess({
        sessionId,
        resumeId,
        userId,
      })

      await enableCollaboration({
        sessionId,
        resumeId,
        userId,
        userName,
        role: 'guest',
        shouldSaveSnapshot: false,
        get,
        set,
      })

      toast.info('已加入实时协作', { description: '正在与发起者同步内容' })
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '加入协作失败'
      set({ isConnecting: false, error: message })
      toast.error(message)
      throw error
    }
  },

  resumeHosting: async ({ sessionId, resumeId, userId, userName }) => {
    logger.automerge.collab('恢复协作会话', { sessionId, resumeId })

    // 验证会话（作为 host）
    const result = collaborationSessionService.validateSession({
      sessionId,
      resumeId,
      userId,
      isHost: true,
    })

    if (!result.isValid) {
      const errorMessage = result.errorMessage || '无法恢复协作会话'
      set({
        isConnecting: false,
        error: errorMessage,
        sessionValidationError: errorMessage,
      })
      toast.error('无法恢复协作', { description: errorMessage })
      throw new Error(errorMessage)
    }

    try {
      await enableCollaboration({
        sessionId,
        resumeId,
        userId,
        userName,
        role: 'host',
        shouldSaveSnapshot: false,
        get,
        set,
      })

      toast.success('已恢复实时协作', { description: '协作者可以继续编辑' })
    }
    catch (error) {
      const message = error instanceof Error ? error.message : '恢复协作失败'
      set({ isConnecting: false, error: message })
      toast.error(message)
      throw error
    }
  },

  stopSharing: ({ silent } = {}) => {
    const state = get()

    if (!state.isSharing && !state.sessionId) {
      return
    }

    const docManager = useResumeStore.getState().docManager

    // 如果是 host，需要使会话失效，确保所有协作链接立即失效
    if (state.role === 'host' && state.sessionId && state.resumeId && state.selfUserId) {
      // 广播协作结束事件
      if (docManager) {
        docManager.broadcastCollaborationEvent('share-ended', { reason: 'host_closed' })
      }

      // 使当前会话失效
      collaborationSessionService.invalidateSession({
        sessionId: state.sessionId,
        resumeId: state.resumeId,
        userId: state.selfUserId,
        reason: 'host_closed',
      })

      // 标记本地存储中的会话为失效
      markSessionAsInvalidated({
        sessionId: state.sessionId,
        resumeId: state.resumeId,
        reason: 'host_closed',
      })

      // 记录安全日志
      securityLogger.logCollaborationEnded({
        sessionId: state.sessionId,
        resumeId: state.resumeId,
        userId: state.selfUserId,
        reason: 'host_closed',
        details: { participantCount: Object.keys(state.participants).length },
      })

      logger.automerge.collab('协作已关闭，所有相关链接已失效', {
        sessionId: state.sessionId,
        resumeId: state.resumeId,
      })
    }
    else if (state.role === 'guest' && state.sessionId && state.resumeId && state.selfUserId) {
      // 访客退出时记录日志
      securityLogger.logCollaborationEnded({
        sessionId: state.sessionId,
        resumeId: state.resumeId,
        userId: state.selfUserId,
        reason: 'guest_left',
      })
    }

    try {
      docManager?.disableCollaboration()
    }
    catch (error: any) {
      toast.error('关闭协作时出错，请重试', error.message)
    }

    if (state.sessionId && state.resumeId && state.selfUserId) {
      clearStoredSession(state.sessionId, state.resumeId, state.selfUserId)
    }

    // 清除 UI 事件监听器
    state.uiEventListeners.clear()

    set({
      isSharing: false,
      isConnecting: false,
      role: null,
      sessionId: null,
      shareUrl: null,
      channelName: null,
      resumeId: null,
      roomName: null,
      participants: {},
      error: null,
      selfPeerId: null,
      selfUserId: null,
      shareEndedByRemote: false,
      sessionValidationError: null,
      isSessionValid: true,
      uiEventListeners: new Set<UIEventListener>(),
    })

    if (!silent) {
      toast.success(state.role === 'host' ? '已关闭实时协作' : '已退出实时协作')
    }
  },

  handleRemoteShareEnd: () => {
    const { role, sessionId, resumeId, selfUserId } = get()
    if (!role)
      return

    const docManager = useResumeStore.getState().docManager
    docManager?.disableCollaboration()

    // 标记会话为已失效（确保后续访问被拒绝）
    if (sessionId && resumeId) {
      markSessionAsInvalidated({
        sessionId,
        resumeId,
        reason: 'host_closed',
      })

      // 记录安全日志
      if (selfUserId) {
        securityLogger.logSessionInvalidated({
          sessionId,
          resumeId,
          userId: selfUserId,
          reason: 'host_closed',
          details: { receivedFrom: 'remote_broadcast' },
        })
      }
    }

    if (sessionId && resumeId && selfUserId) {
      clearStoredSession(sessionId, resumeId, selfUserId)
    }

    // 清除 UI 事件监听器
    get().uiEventListeners.clear()

    set({
      isSharing: false,
      isConnecting: false,
      sessionId: null,
      shareUrl: null,
      channelName: null,
      resumeId: null,
      roomName: null,
      participants: {},
      role: null,
      selfPeerId: null,
      selfUserId: null,
      shareEndedByRemote: true,
      uiEventListeners: new Set<UIEventListener>(),
    })

    toast.warning('协作已结束', { description: '发起者已关闭实时协作，链接已失效' })
  },

  acknowledgeRemoteShareEnd: () => {
    if (get().shareEndedByRemote) {
      set({ shareEndedByRemote: false })
    }
  },
}))

export default useCollaborationStore
