/**
 * 协作模块入口点
 * @module collaboration
 * @description 导出协作功能的所有公共接口
 */

// 会话服务
export {
  collaborationSessionService,
  type CollaborationSession,
  type InvalidationReason,
  type SessionStatus,
  type SessionValidationResult,
} from './collaboration-session-service'

// 安全日志
export {
  securityLogger,
  type SecurityEventType,
  type SecurityLogEntry,
} from './collaboration-security-logger'

// 本地会话存储
export {
  clearAllSessionsForResume,
  clearStoredSession,
  getActiveSessionsForResume,
  getSessionInvalidationInfo,
  getStoredSession,
  getStoredSessionRole,
  isSessionInvalidated,
  markAllSessionsAsInvalidated,
  markSessionAsInvalidated,
  rememberSessionRole,
  updateSessionLastAccess,
} from './session-storage'
