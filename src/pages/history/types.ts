import type { Edge, Node } from '@xyflow/react'

// =====================
// Version History Types
// =====================

/** 历史条目（从 automerge 解析） */
export interface HistoryEntry {
  id: string
  snapshot: any
  time: Date | null
  message: string | null
  index: number
  change: Uint8Array
  changeCount?: number
  /** 是否为里程碑版本 */
  isMilestone?: boolean
  /** 里程碑标签 */
  milestoneLabel?: string
  /** 版本标签（用户自定义） */
  label?: string
}

/** 里程碑信息 */
export interface MilestoneInfo {
  entryId: string
  label: string
  createdAt: Date
  color?: string
}

/** Diff 结果 */
export interface DiffField {
  path: string
  label: string
  before: any
  after: any
  type: 'added' | 'removed' | 'changed'
}

export interface DiffResult {
  fields: DiffField[]
  summary: {
    added: number
    removed: number
    changed: number
  }
}

/** 简历信息 */
export interface ResumeInfo {
  id: string
  name: string
  isOffline?: boolean
}

// =====================
// React Flow Node Types
// =====================

/** 版本节点数据 */
export interface VersionNodeData {
  entry: HistoryEntry
  versionNumber: number
  isLatest: boolean
  isSelected: boolean
  isMilestone: boolean
  milestoneLabel?: string
  totalVersions: number
  onPreview: (entry: HistoryEntry) => void
  onRestore: (entry: HistoryEntry) => void
  onSetMilestone: (entry: HistoryEntry) => void
  onDiff: (entry: HistoryEntry) => void
  onEdit: (entry: HistoryEntry) => void
  onDelete: (entry: HistoryEntry) => void
  onInsertAfter: (entry: HistoryEntry) => void
  [key: string]: unknown
}

export type VersionNode = Node<VersionNodeData, 'version'>

/** 插入按钮节点数据 */
export interface InsertNodeData {
  afterEntry: HistoryEntry | null
  onInsert: (afterEntry: HistoryEntry | null) => void
  [key: string]: unknown
}

export type InsertNode = Node<InsertNodeData, 'insert'>

export type HistoryNode = VersionNode | InsertNode
export type HistoryEdge = Edge
