import type { NodeTypes } from '@xyflow/react'
import type { HistoryEntry } from '../../types'
import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import useHistoryStore from '../../store'
import { buildFlowLayout } from '../../utils'
import { VersionNode } from './version-node'
import '@xyflow/react/dist/style.css'

const nodeTypes: NodeTypes = {
  version: VersionNode,
}

interface VersionFlowProps {
  entries: HistoryEntry[]
}

export function VersionFlow({ entries }: VersionFlowProps) {
  const {
    setPreviewEntry,
    setRestoreEntry,
    setMilestoneDialogEntry,
    setEditDialogEntry,
    deleteEntry,
    insertEntryAfter,
    setDiffSourceEntry,
    diffSourceEntry,
    openDiff,
    historyList,
  } = useHistoryStore()

  const handlePreview = useCallback(
    (entry: HistoryEntry) => setPreviewEntry(entry),
    [setPreviewEntry],
  )

  const handleRestore = useCallback(
    (entry: HistoryEntry) => setRestoreEntry(entry),
    [setRestoreEntry],
  )

  const handleSetMilestone = useCallback(
    (entry: HistoryEntry) => setMilestoneDialogEntry(entry),
    [setMilestoneDialogEntry],
  )

  const handleDiff = useCallback(
    (entry: HistoryEntry) => {
      if (!diffSourceEntry) {
        // 第一步：选择基准版本
        setDiffSourceEntry(entry)
      }
      else {
        // 第二步：选择目标版本，开始对比
        if (diffSourceEntry.id !== entry.id) {
          openDiff(diffSourceEntry, entry)
        }
        setDiffSourceEntry(null)
      }
    },
    [diffSourceEntry, setDiffSourceEntry, openDiff],
  )

  const handleEdit = useCallback(
    (entry: HistoryEntry) => setEditDialogEntry(entry),
    [setEditDialogEntry],
  )

  const handleDelete = useCallback(
    (entry: HistoryEntry) => deleteEntry(entry.id),
    [deleteEntry],
  )

  const handleInsertAfter = useCallback(
    (entry: HistoryEntry) => insertEntryAfter(entry.id),
    [insertEntryAfter],
  )

  const handleInsertNode = useCallback(
    (afterEntry: HistoryEntry | null) => insertEntryAfter(afterEntry?.id ?? null),
    [insertEntryAfter],
  )

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      buildFlowLayout(entries, {
        onPreview: handlePreview,
        onRestore: handleRestore,
        onSetMilestone: handleSetMilestone,
        onDiff: handleDiff,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onInsertAfter: handleInsertAfter,
        onInsertNode: handleInsertNode,
      }),
    [entries, handlePreview, handleRestore, handleSetMilestone, handleDiff, handleEdit, handleDelete, handleInsertAfter, handleInsertNode],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // 当 entries 变化时同步
  useMemo(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  return (
    <div className="w-full h-full rounded-lg border bg-background/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10,
            height: 10,
            color: 'var(--muted-foreground)',
          },
          style: {
            stroke: 'var(--muted-foreground)',
            strokeWidth: 2,
            opacity: 0.5,
          },
        }}
        proOptions={{ hideAttribution: true }}
        className="version-flow"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="oklch(0.552 0.016 285.938 / 0.15)" />
        <Controls
          showInteractive={false}
          className="bg-background! border-border! shadow-sm!"
        />
      </ReactFlow>

      {/* Diff 选择提示 */}
      {diffSourceEntry && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-lg text-sm flex items-center justify-between gap-3 z-50">
          <span className="leading-snug">
            🔍 已选择版本
            {historyList.findIndex(e => e.id === diffSourceEntry.id) + 1}
            ，请点击另一个版本进行对比
          </span>
          <Button
            className="text-primary-foreground/80 hover:text-primary-foreground text-xs shrink-0"
            variant="link"
            size="sm"
            onClick={() => setDiffSourceEntry(null)}
          >
            取消
          </Button>
        </div>
      )}
    </div>
  )
}
