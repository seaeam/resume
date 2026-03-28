/**
 * 协作 UI 同步组件
 *
 * 负责在协作模式下同步编辑器的 UI 状态：
 * 1. 监听本地 UI 变化并广播给协作者
 * 2. 接收远程 UI 动作并应用到本地
 * 3. 提供跟随模式开关
 * 4. 同步工具栏配置（间距/字体/主题）
 */
import type { RefObject } from 'react'
import type { UIAction } from '@/lib/collaboration'
import type { ORDERType } from '@/lib/schema'
import { Eye, EyeOff, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useRealtimeCollabUI } from '@/hooks/use-realtime-collab-ui'
import { useThrottledCallback } from '@/hooks/use-throttled-callback'
import { useCollaborationUIStore } from '@/lib/collaboration'
import useResumeConfigStore from '@/store/resume/config'

type ScrollTarget = 'window' | 'preview'

interface CollaborationUISyncProps {
  /** Supabase channel room name */
  roomName: string
  /** 当前用户显示名 */
  username: string
  /** 抽屉是否打开 */
  drawerOpen: boolean
  /** 设置抽屉打开状态 */
  setDrawerOpen: (open: boolean) => void
  /** 当前激活的 tab */
  activeTabId: ORDERType
  /** 切换 tab 回调 */
  onUpdateActiveTabId: (id: ORDERType) => void
  /** 预览区滚动容器 */
  scrollContainerRef: RefObject<HTMLDivElement | null>
}

export function CollaborationUISync({
  roomName,
  username,
  drawerOpen,
  setDrawerOpen,
  activeTabId,
  onUpdateActiveTabId,
  scrollContainerRef,
}: CollaborationUISyncProps) {
  // 从 config store 读取工具栏配置
  const spacing = useResumeConfigStore(s => s.spacing)
  const font = useResumeConfigStore(s => s.font)
  const theme = useResumeConfigStore(s => s.theme)
  const replaceConfig = useResumeConfigStore(s => s.replaceConfig)

  const config = useMemo(() => ({ spacing, font, theme }), [spacing, font, theme])

  const getScrollPosition = useCallback(() => {
    const previewScrollTop = scrollContainerRef.current?.scrollTop ?? 0
    const windowScrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0

    return previewScrollTop > 0 ? previewScrollTop : windowScrollTop
  }, [scrollContainerRef])

  const { broadcastUIAction } = useRealtimeCollabUI({
    roomName,
    username,
    drawerOpen,
    activeTabId,
    config,
    getScrollPosition,
  })

  const { followMode, setFollowMode, latestRemoteAction, clearLatestRemoteAction, remoteUIStates } = useCollaborationUIStore()

  // 使用 ref 避免循环广播（防止接收远程动作后又广播出去）
  const isApplyingRemote = useRef(false)
  const suppressScrollSyncUntilRef = useRef(0)

  const suppressScrollSync = useCallback((durationMs = 180) => {
    suppressScrollSyncUntilRef.current = Date.now() + durationMs
  }, [])

  const shouldIgnoreScrollSync = useCallback(() => {
    return Date.now() < suppressScrollSyncUntilRef.current
  }, [])

  // 当本地抽屉状态变化时广播
  const prevDrawerOpen = useRef(drawerOpen)
  useEffect(() => {
    if (prevDrawerOpen.current !== drawerOpen) {
      prevDrawerOpen.current = drawerOpen
      if (!isApplyingRemote.current) {
        broadcastUIAction({ kind: 'drawer-toggle', open: drawerOpen })
      }
    }
  }, [drawerOpen, broadcastUIAction])

  // 当本地 tab 切换时广播
  const prevActiveTab = useRef(activeTabId)
  useEffect(() => {
    if (prevActiveTab.current !== activeTabId) {
      prevActiveTab.current = activeTabId
      if (!isApplyingRemote.current) {
        broadcastUIAction({ kind: 'tab-switch', tabId: activeTabId })
      }
    }
  }, [activeTabId, broadcastUIAction])

  // 当本地工具栏配置变化时广播
  const prevSpacing = useRef(spacing)
  const prevFont = useRef(font)
  const prevTheme = useRef(theme)

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevSpacing.current) !== JSON.stringify(spacing)) {
      prevSpacing.current = spacing
      broadcastUIAction({ kind: 'config-spacing', data: spacing })
    }
  }, [spacing, broadcastUIAction])

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevFont.current) !== JSON.stringify(font)) {
      prevFont.current = font
      broadcastUIAction({ kind: 'config-font', data: font })
    }
  }, [font, broadcastUIAction])

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevTheme.current) !== JSON.stringify(theme)) {
      prevTheme.current = theme
      broadcastUIAction({ kind: 'config-theme', data: theme })
    }
  }, [theme, broadcastUIAction])

  const getScrollTarget = useCallback((): ScrollTarget => {
    const previewElement = scrollContainerRef.current
    if (previewElement && previewElement.scrollHeight > previewElement.clientHeight)
      return 'preview'
    return 'window'
  }, [scrollContainerRef])

  const getScrollPositionByTarget = useCallback((target: ScrollTarget) => {
    if (target === 'preview')
      return scrollContainerRef.current?.scrollTop ?? 0

    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0
  }, [scrollContainerRef])

  const broadcastScroll = useThrottledCallback((target: ScrollTarget) => {
    if (isApplyingRemote.current || shouldIgnoreScrollSync())
      return

    broadcastUIAction({
      kind: 'scroll',
      position: getScrollPositionByTarget(target),
      target,
    })
  }, 80, [broadcastUIAction, getScrollPositionByTarget, shouldIgnoreScrollSync])

  useEffect(() => {
    const previewElement = scrollContainerRef.current

    const handleWindowScroll = () => {
      if (getScrollTarget() === 'window')
        broadcastScroll('window')
    }

    const handlePreviewScroll = () => {
      broadcastScroll('preview')
    }

    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    previewElement?.addEventListener('scroll', handlePreviewScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleWindowScroll)
      previewElement?.removeEventListener('scroll', handlePreviewScroll)
      broadcastScroll.cancel()
    }
  }, [scrollContainerRef, getScrollTarget, broadcastScroll])

  // 应用远程 UI 动作
  const applyRemoteAction = useCallback((action: UIAction, userName: string) => {
    isApplyingRemote.current = true

    switch (action.kind) {
      case 'drawer-toggle':
        setDrawerOpen(action.open)
        toast.info(`${userName} ${action.open ? '打开' : '关闭'}了编辑抽屉`, {
          duration: 2000,
          position: 'bottom-left',
        })
        break

      case 'tab-switch':
        onUpdateActiveTabId(action.tabId)
        break

      case 'config-spacing':
        replaceConfig({ spacing: action.data })
        break

      case 'config-font':
        replaceConfig({ font: action.data })
        break

      case 'config-theme':
        replaceConfig({ theme: action.data })
        toast.info(`${userName} 更改了主题`, { duration: 1500, position: 'bottom-left' })
        break

      case 'scroll':
        suppressScrollSync()
        if (action.target === 'preview' && scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: action.position,
            behavior: 'auto',
          })
        }
        else {
          window.scrollTo({
            top: action.position,
            behavior: 'auto',
          })
        }
        break
    }

    // 延迟重置 flag，让 React 完成当前更新周期
    requestAnimationFrame(() => {
      isApplyingRemote.current = false
    })
  }, [setDrawerOpen, onUpdateActiveTabId, replaceConfig, scrollContainerRef, suppressScrollSync])

  // 响应最新的远程 UI 动作
  useEffect(() => {
    if (!latestRemoteAction || !followMode)
      return

    applyRemoteAction(latestRemoteAction, latestRemoteAction.userName)
    clearLatestRemoteAction()
  }, [latestRemoteAction, followMode, applyRemoteAction, clearLatestRemoteAction])

  // 获取远程用户状态摘要
  const remoteUsers = Object.values(remoteUIStates)
  // 只显示最近更新过状态的用户（lastUpdate 基于 Date.now，放宽到显示所有有状态的用户）
  const activeRemoteUsers = remoteUsers

  return (
    <div className="flex items-center gap-2">
      {/* 跟随模式开关 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={followMode ? 'default' : 'outline'}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => {
              setFollowMode(!followMode)
              toast.info(followMode ? '已关闭跟随模式' : '已开启跟随模式', {
                description: followMode
                  ? '将不再同步协作者的 UI 操作'
                  : '将自动跟随协作者的 UI 操作',
                duration: 2000,
              })
            }}
          >
            {followMode ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            {followMode ? '跟随中' : '独立浏览'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {followMode
            ? '跟随模式：协作者的 UI 操作将自动同步到你的界面'
            : '独立浏览模式：不同步协作者的 UI 操作'}
        </TooltipContent>
      </Tooltip>

      {/* 在线协作者状态指示 */}
      {activeRemoteUsers.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1 h-7 text-xs cursor-default">
              <Users className="h-3 w-3" />
              {activeRemoteUsers.length}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium mb-1">在线协作者</p>
              {activeRemoteUsers.map(u => (
                <div key={u.userId} className="flex items-center gap-2 py-0.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: u.color }}
                  />
                  <span>{u.userName}</span>
                  <span className="text-muted-foreground">
                    {u.drawerOpen ? '编辑中' : '预览中'}
                    {u.activeTabId ? ` · ${u.activeTabId}` : ''}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
