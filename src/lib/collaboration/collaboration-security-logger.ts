/**
 * 协作安全日志模块
 * @module collaboration/security-logger
 * @description 记录协作链接相关的安全事件，便于审计和问题排查
 */

import { logger } from '@/lib/logger'

/**
 * 安全事件类型
 */
export type SecurityEventType
  = | 'session_created' // 会话创建
    | 'session_invalidated' // 会话失效
    | 'session_expired' // 会话过期
    | 'link_accessed' // 链接访问
    | 'link_access_denied' // 链接访问被拒绝
    | 'link_validation_success' // 链接验证成功
    | 'link_validation_failed' // 链接验证失败
    | 'permission_changed' // 权限变更
    | 'collaboration_started' // 协作开始
    | 'collaboration_ended' // 协作结束
    | 'duplicate_access_attempt' // 重复访问尝试
    | 'security_bypass_attempt' // 安全绕过尝试

/**
 * 安全事件日志条目
 */
export interface SecurityLogEntry {
  eventType: SecurityEventType
  timestamp: string
  sessionId?: string
  resumeId?: string
  userId?: string
  peerId?: string
  details?: Record<string, any>
  success: boolean
  errorMessage?: string
  clientInfo?: {
    userAgent?: string
    ipHint?: string
  }
}

/**
 * 安全日志存储键
 */
const SECURITY_LOG_KEY = 'resume:collaboration:security_logs'
const MAX_LOG_ENTRIES = 1000

/**
 * 获取当前时间戳
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * 获取客户端信息
 */
function getClientInfo(): SecurityLogEntry['clientInfo'] {
  if (typeof window === 'undefined') {
    return undefined
  }
  return {
    userAgent: navigator.userAgent?.slice(0, 200),
  }
}

/**
 * 读取安全日志
 */
function readSecurityLogs(): SecurityLogEntry[] {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY)
    if (!raw)
      return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  }
  catch {
    return []
  }
}

/**
 * 写入安全日志
 */
function writeSecurityLogs(logs: SecurityLogEntry[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return
  }

  try {
    // 保留最新的日志条目
    const trimmed = logs.slice(-MAX_LOG_ENTRIES)
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(trimmed))
  }
  catch {
    // 忽略存储错误
  }
}

/**
 * 协作安全日志记录器
 */
export const securityLogger = {
  /**
   * 记录安全事件
   */
  log(entry: Omit<SecurityLogEntry, 'timestamp' | 'clientInfo'>): void {
    const fullEntry: SecurityLogEntry = {
      ...entry,
      timestamp: getCurrentTimestamp(),
      clientInfo: getClientInfo(),
    }

    // 写入本地存储
    const logs = readSecurityLogs()
    logs.push(fullEntry)
    writeSecurityLogs(logs)

    // 同时使用常规日志记录
    const logPrefix = `🔐 [Security] ${entry.eventType}`
    const logData = {
      sessionId: entry.sessionId,
      resumeId: entry.resumeId,
      userId: entry.userId,
      success: entry.success,
      details: entry.details,
    }

    if (entry.success) {
      logger.info(logPrefix, logData)
    }
    else {
      logger.warn(logPrefix, { ...logData, error: entry.errorMessage })
    }
  },

  /**
   * 记录会话创建
   */
  logSessionCreated(params: {
    sessionId: string
    resumeId: string
    userId: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'session_created',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: true,
      details: params.details,
    })
  },

  /**
   * 记录会话失效
   */
  logSessionInvalidated(params: {
    sessionId: string
    resumeId: string
    userId: string
    reason: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'session_invalidated',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: true,
      details: { reason: params.reason, ...params.details },
    })
  },

  /**
   * 记录链接访问尝试
   */
  logLinkAccess(params: {
    sessionId: string
    resumeId: string
    userId?: string
    success: boolean
    reason?: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: params.success ? 'link_accessed' : 'link_access_denied',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: params.success,
      errorMessage: params.success ? undefined : params.reason,
      details: params.details,
    })
  },

  /**
   * 记录链接验证结果
   */
  logLinkValidation(params: {
    sessionId: string
    resumeId: string
    userId?: string
    success: boolean
    validationResult?: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: params.success ? 'link_validation_success' : 'link_validation_failed',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: params.success,
      errorMessage: params.success ? undefined : params.validationResult,
      details: params.details,
    })
  },

  /**
   * 记录重复访问尝试
   */
  logDuplicateAccessAttempt(params: {
    sessionId: string
    resumeId: string
    userId?: string
    originalAccessTime?: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'duplicate_access_attempt',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: false,
      errorMessage: '链接已被使用',
      details: { originalAccessTime: params.originalAccessTime, ...params.details },
    })
  },

  /**
   * 记录安全绕过尝试
   */
  logSecurityBypassAttempt(params: {
    sessionId?: string
    resumeId?: string
    userId?: string
    attemptType: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'security_bypass_attempt',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: false,
      errorMessage: `安全绕过尝试: ${params.attemptType}`,
      details: params.details,
    })
  },

  /**
   * 记录协作开始
   */
  logCollaborationStarted(params: {
    sessionId: string
    resumeId: string
    userId: string
    role: 'host' | 'guest'
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'collaboration_started',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: true,
      details: { role: params.role, ...params.details },
    })
  },

  /**
   * 记录协作结束
   */
  logCollaborationEnded(params: {
    sessionId: string
    resumeId: string
    userId: string
    reason: string
    details?: Record<string, any>
  }): void {
    this.log({
      eventType: 'collaboration_ended',
      sessionId: params.sessionId,
      resumeId: params.resumeId,
      userId: params.userId,
      success: true,
      details: { reason: params.reason, ...params.details },
    })
  },

  /**
   * 获取安全日志
   */
  getLogs(filter?: {
    sessionId?: string
    resumeId?: string
    eventType?: SecurityEventType
    startTime?: string
    endTime?: string
  }): SecurityLogEntry[] {
    let logs = readSecurityLogs()

    if (filter) {
      if (filter.sessionId) {
        logs = logs.filter(l => l.sessionId === filter.sessionId)
      }
      if (filter.resumeId) {
        logs = logs.filter(l => l.resumeId === filter.resumeId)
      }
      if (filter.eventType) {
        logs = logs.filter(l => l.eventType === filter.eventType)
      }
      if (filter.startTime) {
        logs = logs.filter(l => l.timestamp >= filter.startTime!)
      }
      if (filter.endTime) {
        logs = logs.filter(l => l.timestamp <= filter.endTime!)
      }
    }

    return logs
  },

  /**
   * 清除安全日志
   */
  clearLogs(): void {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.removeItem(SECURITY_LOG_KEY)
    }
  },

  /**
   * 导出安全日志（用于审计）
   */
  exportLogs(): string {
    const logs = readSecurityLogs()
    return JSON.stringify(logs, null, 2)
  },
}
