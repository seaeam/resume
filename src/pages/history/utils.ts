import type { DiffResult, HistoryEdge, HistoryEntry, HistoryNode } from './types'
import dayjs from 'dayjs'
import useResumeConfigStore from '@/store/resume/config'
import { DIFF_FIELD_LABELS, FLOW_LAYOUT } from './const'

/**
 * 构建指定版本的快照
 */
export async function buildSnapshot(
  allChanges: Uint8Array[],
  targetIndex: number,
): Promise<any> {
  if (allChanges.length === 0 || targetIndex < 0)
    return null

  try {
    const Automerge = await import('@automerge/automerge')
    const targetChanges = allChanges.slice(0, targetIndex + 1)

    let historicalDoc = Automerge.init<any>()
    ;[historicalDoc] = Automerge.applyChanges(historicalDoc, targetChanges)

    const snapshot = JSON.parse(JSON.stringify(historicalDoc))

    if (!snapshot.config) {
      const currentConfig = useResumeConfigStore.getState()
      snapshot.config = {
        theme: currentConfig.theme,
        font: currentConfig.font,
        spacing: currentConfig.spacing,
      }
    }

    return snapshot
  }
  catch (error) {
    console.error('构建快照失败', error)
    return null
  }
}

/**
 * 计算两个快照之间的 diff
 */
export function computeDiff(before: any, after: any): DiffResult {
  const fields: DiffResult['fields'] = []

  const compareKeys = [
    'basics',
    'jobIntent',
    'eduBackground',
    'workExperience',
    'internshipExperience',
    'projectExperience',
    'campusExperience',
    'skillSpecialty',
    'honorsCertificates',
    'selfEvaluation',
    'hobbies',
    'order',
    'visibility',
    'type',
  ]

  for (const key of compareKeys) {
    const bVal = before[key]
    const aVal = after[key]
    const bStr = JSON.stringify(bVal ?? null)
    const aStr = JSON.stringify(aVal ?? null)

    if (bStr !== aStr) {
      if (bVal == null && aVal != null) {
        fields.push({
          path: key,
          label: DIFF_FIELD_LABELS[key] || key,
          before: bVal,
          after: aVal,
          type: 'added',
        })
      }
      else if (bVal != null && aVal == null) {
        fields.push({
          path: key,
          label: DIFF_FIELD_LABELS[key] || key,
          before: bVal,
          after: aVal,
          type: 'removed',
        })
      }
      else {
        // 对象级别的 key 做深层对比
        if (typeof bVal === 'object' && typeof aVal === 'object' && !Array.isArray(bVal)) {
          deepCompare(key, bVal, aVal, fields)
        }
        else {
          fields.push({
            path: key,
            label: DIFF_FIELD_LABELS[key] || key,
            before: bVal,
            after: aVal,
            type: 'changed',
          })
        }
      }
    }
  }

  return {
    fields,
    summary: {
      added: fields.filter(f => f.type === 'added').length,
      removed: fields.filter(f => f.type === 'removed').length,
      changed: fields.filter(f => f.type === 'changed').length,
    },
  }
}

function deepCompare(
  parentPath: string,
  before: Record<string, any>,
  after: Record<string, any>,
  fields: DiffResult['fields'],
) {
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])

  for (const key of allKeys) {
    const path = `${parentPath}.${key}`
    const bVal = before?.[key]
    const aVal = after?.[key]
    const bStr = JSON.stringify(bVal ?? null)
    const aStr = JSON.stringify(aVal ?? null)

    if (bStr === aStr)
      continue

    if (bVal == null && aVal != null) {
      fields.push({ path, label: DIFF_FIELD_LABELS[path] || key, before: bVal, after: aVal, type: 'added' })
    }
    else if (bVal != null && aVal == null) {
      fields.push({ path, label: DIFF_FIELD_LABELS[path] || key, before: bVal, after: aVal, type: 'removed' })
    }
    else {
      fields.push({ path, label: DIFF_FIELD_LABELS[path] || key, before: bVal, after: aVal, type: 'changed' })
    }
  }
}

/**
 * 格式化相对时间
 */
export function formatTime(date: Date | null): string {
  if (!date)
    return '未知时间'

  const now = dayjs()
  const target = dayjs(date)
  const diffMs = now.diff(target)

  if (diffMs < 60 * 1000)
    return '刚刚'
  if (diffMs < 60 * 60 * 1000)
    return `${Math.floor(diffMs / (60 * 1000))} 分钟前`
  if (diffMs < 24 * 60 * 60 * 1000)
    return `${Math.floor(diffMs / (60 * 60 * 1000))} 小时前`
  if (diffMs < 7 * 24 * 60 * 60 * 1000)
    return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))} 天前`

  return target.format('M月D日 HH:mm')
}

/**
 * 计算 S 形布局的节点和边
 * 节点排列为蛇形（S 形回绕）
 */
export function buildFlowLayout(
  entries: HistoryEntry[],
  callbacks: {
    onPreview: (entry: HistoryEntry) => void
    onRestore: (entry: HistoryEntry) => void
    onSetMilestone: (entry: HistoryEntry) => void
    onDiff: (entry: HistoryEntry) => void
    onEdit: (entry: HistoryEntry) => void
    onDelete: (entry: HistoryEntry) => void
    onInsertAfter: (entry: HistoryEntry) => void
    onInsertNode: (afterEntry: HistoryEntry | null) => void
  },
): { nodes: HistoryNode[], edges: HistoryEdge[] } {
  const nodes: HistoryNode[] = []
  const edges: HistoryEdge[] = []

  const { NODES_PER_ROW, NODE_GAP_X, NODE_GAP_Y, PADDING } = FLOW_LAYOUT
  const totalVersions = entries.length

  entries.forEach((entry, i) => {
    const row = Math.floor(i / NODES_PER_ROW)
    const colInRow = i % NODES_PER_ROW
    // S 形：偶数行从左到右，奇数行从右到左
    const isReversed = row % 2 === 1
    const col = isReversed ? NODES_PER_ROW - 1 - colInRow : colInRow

    const x = PADDING + col * NODE_GAP_X
    const y = PADDING + row * NODE_GAP_Y

    const versionNumber = totalVersions - i
    const isLatest = i === 0

    nodes.push({
      id: entry.id,
      type: 'version',
      position: { x, y },
      data: {
        entry,
        versionNumber,
        isLatest,
        isSelected: false,
        isMilestone: !!entry.isMilestone,
        milestoneLabel: entry.milestoneLabel,
        totalVersions,
        onPreview: callbacks.onPreview,
        onRestore: callbacks.onRestore,
        onSetMilestone: callbacks.onSetMilestone,
        onDiff: callbacks.onDiff,
        onEdit: callbacks.onEdit,
        onDelete: callbacks.onDelete,
        onInsertAfter: callbacks.onInsertAfter,
      },
    })

    // 连接边 - S形布局需要正确的连接手柄
    if (i > 0) {
      const prevEntry = entries[i - 1]
      const prevRow = Math.floor((i - 1) / NODES_PER_ROW)
      const currentRow = Math.floor(i / NODES_PER_ROW)
      const sameRow = prevRow === currentRow

      let sourceHandle: string
      let targetHandle: string

      if (sameRow) {
        // 同一行：水平连接
        const isRowReversed = currentRow % 2 === 1
        if (isRowReversed) {
          // 奇数行从右到左：当前（旧）在左边 → 上一个（新）在右边
          sourceHandle = 'right'
          targetHandle = 'left'
        }
        else {
          // 偶数行从左到右：当前（旧）在右边 → 上一个（新）在左边
          sourceHandle = 'left'
          targetHandle = 'right'
        }
      }
      else {
        // 跨行：当前行第一个（旧） → 上一行最后一个（新）
        sourceHandle = 'top'
        targetHandle = 'bottom'
      }

      edges.push({
        id: `edge-${entry.id}-${prevEntry.id}`,
        source: entry.id,
        target: prevEntry.id,
        type: 'default',
        sourceHandle,
        targetHandle,
        animated: false,
      })
    }
  })

  return { nodes, edges }
}
