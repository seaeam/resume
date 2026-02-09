import type { NodeProps } from '@xyflow/react'
import type React from 'react'
import type { VersionNodeData } from '../../types'
import { Handle, Position } from '@xyflow/react'
import { Clock, Eye, Flag, GitBranch, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { formatTime } from '../../utils'

/** 阻止事件冒泡到 ReactFlow 的 onNodeClick */
function stop(e: React.MouseEvent) {
  e.stopPropagation()
}

export function VersionNode({ data }: NodeProps) {
  const {
    entry,
    versionNumber,
    isLatest,
    isMilestone,
    milestoneLabel,
    onPreview,
    onRestore,
    onSetMilestone,
    onDiff,
    onEdit,
    onDelete,
    onInsertAfter,
  } = data as VersionNodeData

  return (
    <TooltipProvider delayDuration={300}>
      <div
        className={`
          group relative rounded-xl border-2 bg-background p-3 shadow-sm
          transition-all duration-200 cursor-pointer
          hover:shadow-md
          ${isLatest
      ? 'border-primary bg-primary/5 shadow-primary/10'
      : isMilestone
        ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
        : 'border-border hover:border-primary/40'
    }
        `}
        style={{ width: 220 }}
      >
        {/* 连接手柄 - 每个位置既是 source 也是 target */}
        <Handle type="source" position={Position.Left} id="left" className="w-2! h-2! bg-muted-foreground/40! border-0! left-0! translate-x-[-50%]!" />
        <Handle type="target" position={Position.Left} id="left" className="w-0! h-0! opacity-0! left-0! translate-x-[-50%]!" />
        <Handle type="source" position={Position.Right} id="right" className="w-2! h-2! bg-muted-foreground/40! border-0! right-0! translate-x-[50%]!" />
        <Handle type="target" position={Position.Right} id="right" className="w-0! h-0! opacity-0! right-0! translate-x-[50%]!" />
        <Handle type="source" position={Position.Top} id="top" className="w-2! h-2! bg-muted-foreground/40! border-0! top-0! translate-y-[-50%]!" />
        <Handle type="target" position={Position.Top} id="top" className="w-0! h-0! opacity-0! top-0! translate-y-[-50%]!" />
        <Handle type="source" position={Position.Bottom} id="bottom" className="w-2! h-2! bg-muted-foreground/40! border-0! bottom-0! translate-y-[50%]!" />
        <Handle type="target" position={Position.Bottom} id="bottom" className="w-0! h-0! opacity-0! bottom-0! translate-y-[50%]!" />

        {/* 标题行 */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {isMilestone && (
              <Flag className="h-3.5 w-3.5 text-amber-500" />
            )}
            <span className="text-sm font-semibold truncate max-w-[120px]">
              {entry.label || (isLatest ? '当前版本' : `版本 ${versionNumber}`)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {isLatest && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                最新
              </Badge>
            )}

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  onClick={stop}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onPreview(entry)}>
                  <Eye className="h-4 w-4 mr-2" />
                  预览
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDiff(entry)}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  版本对比
                </DropdownMenuItem>
                {!isLatest && (
                  <DropdownMenuItem onClick={() => onRestore(entry)}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    恢复到此版本
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onSetMilestone(entry)}>
                  <Flag className="h-4 w-4 mr-2" />
                  {isMilestone ? '编辑里程碑' : '设为里程碑'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  编辑标签
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onInsertAfter(entry)}>
                  <Plus className="h-4 w-4 mr-2" />
                  在后方插入
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(entry)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除版本
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 里程碑标签 */}
        {isMilestone && milestoneLabel && (
          <div className="mb-1.5 overflow-hidden">
            <Badge
              variant="outline"
              className="text-[10px] max-w-full truncate inline-block bg-amber-100/80 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700"
            >
              🏁
              {' '}
              {milestoneLabel}
            </Badge>
          </div>
        )}

        {/* 时间 */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTime(entry.time)}</span>
        </div>

        {/* 变更数 */}
        {entry.changeCount && entry.changeCount > 1 && (
          <div className="text-[10px] text-muted-foreground mt-1">
            {entry.changeCount}
            {' '}
            次编辑
          </div>
        )}

        {/* 快捷操作按钮（移动端始终显示，桌面端 hover 显示） */}
        <div className="flex gap-1 mt-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  stop(e)
                  onPreview(entry)
                }}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">预览</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  stop(e)
                  onDiff(entry)
                }}
              >
                <GitBranch className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">对比</TooltipContent>
          </Tooltip>
          {!isLatest && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    stop(e)
                    onRestore(entry)
                  }}
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">恢复</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
