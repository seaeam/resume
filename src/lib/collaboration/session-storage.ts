/**
 * 协作会话本地存储
 * @module collaboration/session-storage
 * @description 管理协作会话的本地存储，支持会话状态和失效标记
 */

const STORAGE_KEY = 'resume:collaboration:sessions'
const INVALIDATED_SESSIONS_KEY = 'resume:collaboration:invalidated_sessions'

type StoredRole = 'host' | 'guest'

/**
 * 会话状态
 */
type SessionStatus = 'active' | 'invalidated' | 'expired'

interface StoredSession {
  sessionId: string
  resumeId: string
  userId: string
  role: StoredRole
  status?: SessionStatus
  createdAt?: string
  lastAccessAt?: string
  invalidatedAt?: string
  invalidationReason?: string
}

/**
 * 已失效会话记录（轻量级）
 */
interface InvalidatedSession {
  sessionId: string
  resumeId: string
  invalidatedAt: string
  reason: string
}

function isSupported() {
  return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

function readStore(): StoredSession[] {
  if (!isSupported())
    return []
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw)
      return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (entry): entry is StoredSession =>
          entry
          && typeof entry.sessionId === 'string'
          && typeof entry.resumeId === 'string'
          && typeof entry.userId === 'string'
          && (entry.role === 'host' || entry.role === 'guest'),
      )
    }
    return []
  }
  catch {
    return []
  }
}

function writeStore(entries: StoredSession[]) {
  if (!isSupported())
    return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  }
  catch {
    // ignore quota errors
  }
}

/**
 * 读取失效会话列表
 */
function readInvalidatedSessions(): InvalidatedSession[] {
  if (!isSupported())
    return []
  try {
    const raw = localStorage.getItem(INVALIDATED_SESSIONS_KEY)
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
 * 写入失效会话列表
 */
function writeInvalidatedSessions(sessions: InvalidatedSession[]) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined')
    return
  try {
    // 只保留最近1000条记录
    const trimmed = sessions.slice(-1000)
    localStorage.setItem(INVALIDATED_SESSIONS_KEY, JSON.stringify(trimmed))
  }
  catch {
    // ignore quota errors
  }
}

/**
 * 记住会话角色
 */
export function rememberSessionRole(entry: StoredSession) {
  const entries = readStore()
  const filtered = entries.filter(
    item => item.sessionId !== entry.sessionId || item.resumeId !== entry.resumeId || item.userId !== entry.userId,
  )
  // 添加时间戳和状态
  const enrichedEntry: StoredSession = {
    ...entry,
    status: entry.status || 'active',
    createdAt: entry.createdAt || new Date().toISOString(),
    lastAccessAt: new Date().toISOString(),
  }
  filtered.push(enrichedEntry)
  writeStore(filtered)
}

/**
 * 获取存储的会话角色
 */
export function getStoredSessionRole(sessionId: string, resumeId: string, userId: string): StoredRole | null {
  const entries = readStore()
  const matched = entries.find(
    item => item.sessionId === sessionId && item.resumeId === resumeId && item.userId === userId,
  )
  return matched?.role ?? null
}

/**
 * 获取完整的会话信息
 */
export function getStoredSession(sessionId: string, resumeId: string, userId: string): StoredSession | null {
  const entries = readStore()
  return entries.find(
    item => item.sessionId === sessionId && item.resumeId === resumeId && item.userId === userId,
  ) ?? null
}

/**
 * 检查会话是否已失效
 */
export function isSessionInvalidated(sessionId: string, resumeId: string): boolean {
  const invalidated = readInvalidatedSessions()
  return invalidated.some(s => s.sessionId === sessionId && s.resumeId === resumeId)
}

/**
 * 获取会话失效信息
 */
export function getSessionInvalidationInfo(sessionId: string, resumeId: string): InvalidatedSession | null {
  const invalidated = readInvalidatedSessions()
  return invalidated.find(s => s.sessionId === sessionId && s.resumeId === resumeId) ?? null
}

/**
 * 标记会话为已失效
 */
export function markSessionAsInvalidated(params: {
  sessionId: string
  resumeId: string
  reason: string
}) {
  const { sessionId, resumeId, reason } = params

  // 添加到失效列表
  const invalidated = readInvalidatedSessions()
  const existing = invalidated.findIndex(s => s.sessionId === sessionId && s.resumeId === resumeId)
  
  const record: InvalidatedSession = {
    sessionId,
    resumeId,
    invalidatedAt: new Date().toISOString(),
    reason,
  }

  if (existing >= 0) {
    invalidated[existing] = record
  } else {
    invalidated.push(record)
  }
  writeInvalidatedSessions(invalidated)

  // 更新本地存储的会话状态
  const entries = readStore()
  const updated = entries.map((entry) => {
    if (entry.sessionId === sessionId && entry.resumeId === resumeId) {
      return {
        ...entry,
        status: 'invalidated' as SessionStatus,
        invalidatedAt: record.invalidatedAt,
        invalidationReason: reason,
      }
    }
    return entry
  })
  writeStore(updated)
}

/**
 * 标记简历的所有会话为已失效
 */
export function markAllSessionsAsInvalidated(params: {
  resumeId: string
  reason: string
}) {
  const { resumeId, reason } = params
  const entries = readStore()
  const now = new Date().toISOString()

  // 收集需要失效的会话
  const toInvalidate: InvalidatedSession[] = []

  const updated = entries.map((entry) => {
    if (entry.resumeId === resumeId && entry.status !== 'invalidated') {
      toInvalidate.push({
        sessionId: entry.sessionId,
        resumeId,
        invalidatedAt: now,
        reason,
      })
      return {
        ...entry,
        status: 'invalidated' as SessionStatus,
        invalidatedAt: now,
        invalidationReason: reason,
      }
    }
    return entry
  })

  writeStore(updated)

  // 更新失效列表
  if (toInvalidate.length > 0) {
    const invalidated = readInvalidatedSessions()
    toInvalidate.forEach((item) => {
      const existing = invalidated.findIndex(s => s.sessionId === item.sessionId && s.resumeId === item.resumeId)
      if (existing >= 0) {
        invalidated[existing] = item
      } else {
        invalidated.push(item)
      }
    })
    writeInvalidatedSessions(invalidated)
  }
}

/**
 * 清除存储的会话
 */
export function clearStoredSession(sessionId: string, resumeId: string, userId: string) {
  const entries = readStore()
  const filtered = entries.filter(
    item => item.sessionId !== sessionId || item.resumeId !== resumeId || item.userId !== userId,
  )
  writeStore(filtered)
}

/**
 * 清除简历的所有会话
 */
export function clearAllSessionsForResume(resumeId: string) {
  const entries = readStore()
  const filtered = entries.filter(item => item.resumeId !== resumeId)
  writeStore(filtered)
}

/**
 * 更新会话最后访问时间
 */
export function updateSessionLastAccess(sessionId: string, resumeId: string, userId: string) {
  const entries = readStore()
  const updated = entries.map((entry) => {
    if (entry.sessionId === sessionId && entry.resumeId === resumeId && entry.userId === userId) {
      return {
        ...entry,
        lastAccessAt: new Date().toISOString(),
      }
    }
    return entry
  })
  writeStore(updated)
}

/**
 * 获取简历的所有活跃会话
 */
export function getActiveSessionsForResume(resumeId: string): StoredSession[] {
  const entries = readStore()
  return entries.filter(
    item => item.resumeId === resumeId && item.status !== 'invalidated'
  )
}

/**
 * 清理过期数据（30天前的失效记录）
 */
export function cleanupExpiredInvalidatedSessions() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const invalidated = readInvalidatedSessions()
  const filtered = invalidated.filter(s => s.invalidatedAt > thirtyDaysAgo)
  if (filtered.length !== invalidated.length) {
    writeInvalidatedSessions(filtered)
  }
}

// 页面加载时自动清理过期数据
if (typeof window !== 'undefined') {
  setTimeout(cleanupExpiredInvalidatedSessions, 2000)
}
