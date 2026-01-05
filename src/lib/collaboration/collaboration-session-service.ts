/**
 * 协作会话服务
 * @module collaboration/session-service
 * @description 管理协作会话的生命周期，包括创建、验证、失效和状态跟踪
 */

import { logger } from '@/lib/logger'
import { securityLogger } from './collaboration-security-logger'

/**
 * 会话状态
 */
export type SessionStatus
  = | 'active' // 活跃状态
    | 'invalidated' // 已失效
    | 'expired' // 已过期
    | 'used' // 已使用（一次性链接）

/**
 * 会话失效原因
 */
export type InvalidationReason
  = | 'host_closed' // 主机关闭协作
    | 'timeout' // 超时
    | 'permission_revoked' // 权限撤销
    | 'manual' // 手动失效
    | 'single_use_consumed' // 一次性使用已消费

/**
 * 协作会话记录
 */
export interface CollaborationSession {
  sessionId: string
  resumeId: string
  hostUserId: string
  status: SessionStatus
  createdAt: string
  updatedAt: string
  expiresAt?: string
  invalidatedAt?: string
  invalidationReason?: InvalidationReason
  accessCount: number
  lastAccessAt?: string
  accessedByUsers: string[]
  metadata?: Record<string, any>
}

/**
 * 会话验证结果
 */
export interface SessionValidationResult {
  isValid: boolean
  session?: CollaborationSession
  errorCode?:
    | 'SESSION_NOT_FOUND'
    | 'SESSION_INVALIDATED'
    | 'SESSION_EXPIRED'
    | 'SESSION_ALREADY_USED'
    | 'PERMISSION_DENIED'
    | 'VALIDATION_ERROR'
  errorMessage?: string
}

/**
 * 会话存储键
 */
const SESSION_STORAGE_KEY = 'resume:collaboration:sessions_v2'
const SESSION_TIMEOUT_MS = 24 * 60 * 60 * 1000 // 24小时

/**
 * 读取会话存储
 */
function readSessionStore(): Record<string, CollaborationSession> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return {}
  }

  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!raw)
      return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  }
  catch {
    return {}
  }
}

/**
 * 写入会话存储
 */
function writeSessionStore(sessions: Record<string, CollaborationSession>): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessions))
  }
  catch {
    // 忽略存储错误
  }
}

/**
 * 生成复合键
 */
function getSessionKey(resumeId: string, sessionId: string): string {
  return `${resumeId}:${sessionId}`
}

/**
 * 检查会话是否过期
 */
function isSessionExpired(session: CollaborationSession): boolean {
  if (session.expiresAt) {
    return new Date(session.expiresAt) < new Date()
  }
  // 默认24小时过期
  const createdTime = new Date(session.createdAt).getTime()
  return Date.now() - createdTime > SESSION_TIMEOUT_MS
}

/**
 * 协作会话服务
 */
export const collaborationSessionService = {
  /**
   * 创建新会话
   */
  createSession(params: {
    sessionId: string
    resumeId: string
    hostUserId: string
    expiresInMs?: number
    metadata?: Record<string, any>
  }): CollaborationSession {
    const now = new Date().toISOString()
    const expiresAt = params.expiresInMs
      ? new Date(Date.now() + params.expiresInMs).toISOString()
      : new Date(Date.now() + SESSION_TIMEOUT_MS).toISOString()

    const session: CollaborationSession = {
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      hostUserId: params.hostUserId,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      expiresAt,
      accessCount: 0,
      accessedByUsers: [],
      metadata: params.metadata,
    }

    // 存储会话
    const sessions = readSessionStore()
    const key = getSessionKey(params.resumeId, params.sessionId)
    sessions[key] = session
    writeSessionStore(sessions)

    // 记录安全日志
    securityLogger.logSessionCreated({
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.hostUserId,
      details: { expiresAt },
    })

    logger.automerge.collab('创建协作会话', { sessionId: params.sessionId, resumeId: params.resumeId })

    return session
  },

  /**
   * 验证会话
   * 注意：由于会话数据存储在创建者的浏览器中，访客无法直接验证会话存在性
   * 因此我们只检查会话是否被明确标记为失效
   */
  validateSession(params: {
    sessionId: string
    resumeId: string
    userId: string
    isHost?: boolean
  }): SessionValidationResult {
    const { sessionId, resumeId, userId, isHost = false } = params
    const sessions = readSessionStore()
    const key = getSessionKey(resumeId, sessionId)
    const session = sessions[key]

    // 如果本地有会话记录，检查其状态
    if (session) {
      // 会话已被手动失效
      if (session.status === 'invalidated') {
        securityLogger.logLinkValidation({
          sessionId,
          resumeId,
          userId,
          success: false,
          validationResult: 'SESSION_INVALIDATED',
          details: { reason: session.invalidationReason },
        })

        return {
          isValid: false,
          session,
          errorCode: 'SESSION_INVALIDATED',
          errorMessage: this.getInvalidationMessage(session.invalidationReason),
        }
      }

      // 会话已过期
      if (session.status === 'expired' || isSessionExpired(session)) {
        session.status = 'expired'
        sessions[key] = session
        writeSessionStore(sessions)

        securityLogger.logLinkValidation({
          sessionId,
          resumeId,
          userId,
          success: false,
          validationResult: 'SESSION_EXPIRED',
        })

        return {
          isValid: false,
          session,
          errorCode: 'SESSION_EXPIRED',
          errorMessage: '协作链接已过期，请联系分享者获取新链接',
        }
      }

      // 本地会话存在且有效
      securityLogger.logLinkValidation({
        sessionId,
        resumeId,
        userId,
        success: true,
        details: { isHost, accessCount: session.accessCount, source: 'local_session' },
      })

      return {
        isValid: true,
        session,
      }
    }

    // 本地没有会话记录（访客场景）
    // 对于访客，只要没有被标记为失效，就允许加入
    // 实际的会话有效性由实时通道连接来验证
    if (!isHost) {
      securityLogger.logLinkValidation({
        sessionId,
        resumeId,
        userId,
        success: true,
        details: { isHost: false, source: 'guest_access' },
      })

      return {
        isValid: true,
      }
    }

    // 主机本地没有会话记录，说明会话可能已丢失或在其他设备创建
    securityLogger.logLinkValidation({
      sessionId,
      resumeId,
      userId,
      success: false,
      validationResult: 'SESSION_NOT_FOUND',
    })

    return {
      isValid: false,
      errorCode: 'SESSION_NOT_FOUND',
      errorMessage: '协作会话不存在或已失效',
    }
  },

  /**
   * 记录会话访问（仅在本地有会话时更新）
   */
  recordAccess(params: {
    sessionId: string
    resumeId: string
    userId: string
  }): void {
    const { sessionId, resumeId, userId } = params
    const sessions = readSessionStore()
    const key = getSessionKey(resumeId, sessionId)
    const session = sessions[key]

    // 如果本地没有会话记录（访客场景），只记录日志
    if (!session) {
      securityLogger.logLinkAccess({
        sessionId,
        resumeId,
        userId,
        success: true,
        details: { accessType: 'guest_access' },
      })
      return
    }

    session.accessCount += 1
    session.lastAccessAt = new Date().toISOString()
    session.updatedAt = new Date().toISOString()

    if (!session.accessedByUsers.includes(userId)) {
      session.accessedByUsers.push(userId)
    }

    sessions[key] = session
    writeSessionStore(sessions)

    securityLogger.logLinkAccess({
      sessionId,
      resumeId,
      userId,
      success: true,
      details: { accessCount: session.accessCount },
    })
  },

  /**
   * 使会话失效
   */
  invalidateSession(params: {
    sessionId: string
    resumeId: string
    userId: string
    reason: InvalidationReason
  }): boolean {
    const { sessionId, resumeId, userId, reason } = params
    const sessions = readSessionStore()
    const key = getSessionKey(resumeId, sessionId)
    const session = sessions[key]

    if (!session) {
      logger.warn('尝试失效不存在的会话', { sessionId, resumeId })
      return false
    }

    // 更新会话状态
    session.status = 'invalidated'
    session.invalidatedAt = new Date().toISOString()
    session.invalidationReason = reason
    session.updatedAt = new Date().toISOString()

    sessions[key] = session
    writeSessionStore(sessions)

    // 记录安全日志
    securityLogger.logSessionInvalidated({
      sessionId,
      resumeId,
      userId,
      reason,
      details: { accessCount: session.accessCount },
    })

    logger.automerge.collab('会话已失效', { sessionId, resumeId, reason })

    return true
  },

  /**
   * 失效指定简历的所有会话
   */
  invalidateAllSessionsForResume(params: {
    resumeId: string
    userId: string
    reason: InvalidationReason
  }): number {
    const { resumeId, userId, reason } = params
    const sessions = readSessionStore()
    let invalidatedCount = 0

    Object.keys(sessions).forEach((key) => {
      const session = sessions[key]
      if (session.resumeId === resumeId && session.status === 'active') {
        session.status = 'invalidated'
        session.invalidatedAt = new Date().toISOString()
        session.invalidationReason = reason
        session.updatedAt = new Date().toISOString()
        invalidatedCount++

        securityLogger.logSessionInvalidated({
          sessionId: session.sessionId,
          resumeId,
          userId,
          reason,
        })
      }
    })

    writeSessionStore(sessions)

    logger.automerge.collab('批量失效会话', { resumeId, count: invalidatedCount })

    return invalidatedCount
  },

  /**
   * 获取会话信息
   */
  getSession(resumeId: string, sessionId: string): CollaborationSession | null {
    const sessions = readSessionStore()
    const key = getSessionKey(resumeId, sessionId)
    return sessions[key] || null
  },

  /**
   * 获取简历的所有活跃会话
   */
  getActiveSessionsForResume(resumeId: string): CollaborationSession[] {
    const sessions = readSessionStore()
    return Object.values(sessions).filter(
      s => s.resumeId === resumeId && s.status === 'active' && !isSessionExpired(s),
    )
  },

  /**
   * 检查用户是否为会话主机
   */
  isSessionHost(resumeId: string, sessionId: string, userId: string): boolean {
    const session = this.getSession(resumeId, sessionId)
    return session?.hostUserId === userId
  },

  /**
   * 清理过期会话
   */
  cleanupExpiredSessions(): number {
    const sessions = readSessionStore()
    let cleanedCount = 0

    Object.keys(sessions).forEach((key) => {
      const session = sessions[key]
      if (isSessionExpired(session)) {
        session.status = 'expired'
        cleanedCount++
      }
    })

    if (cleanedCount > 0) {
      writeSessionStore(sessions)
      logger.automerge.collab('清理过期会话', { count: cleanedCount })
    }

    return cleanedCount
  },

  /**
   * 获取失效原因的友好消息
   */
  getInvalidationMessage(reason?: InvalidationReason): string {
    switch (reason) {
      case 'host_closed':
        return '协作发起者已关闭实时协作，链接已失效'
      case 'timeout':
        return '协作会话已超时，链接已失效'
      case 'permission_revoked':
        return '协作权限已被撤销，链接已失效'
      case 'single_use_consumed':
        return '此链接仅供一次性使用，已被使用'
      case 'manual':
      default:
        return '协作链接已失效，请联系分享者获取新链接'
    }
  },

  /**
   * 导出会话数据（用于调试/审计）
   */
  exportSessions(): string {
    const sessions = readSessionStore()
    return JSON.stringify(sessions, null, 2)
  },

  /**
   * 清除所有会话数据
   */
  clearAllSessions(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY)
    }
  },
}

// 自动清理过期会话
if (typeof window !== 'undefined') {
  // 页面加载时清理
  setTimeout(() => {
    collaborationSessionService.cleanupExpiredSessions()
  }, 1000)

  // 每5分钟清理一次
  setInterval(() => {
    collaborationSessionService.cleanupExpiredSessions()
  }, 5 * 60 * 1000)
}
