/**
 * 实时协作 UI 状态同步 Hook
 *
 * 通过 Supabase Realtime Channel 同步编辑器 UI 状态，包括：
 * - 抽屉开关
 * - 当前激活的 Tab
 * - 鼠标点击事件
 *
 * 使用独立的 channel（`${roomName}:ui`）以避免和光标 channel 冲突。
 */
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  FontConfigType,
  ORDERType,
  SpacingConfigType,
  ThemeConfigType,
} from '@/lib/schema'
import type {
  ClickEventBroadcastPayload,
  UIAction,
  UIActionBroadcastPayload,
  UIStateBroadcastPayload,
} from '@/store/collaboration-ui'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createRealtimeUserId,
  getPresenceUserId,
} from '@/lib/collaboration/realtime-user'
import {
  getViewportSize,
  projectPointToViewport,
} from '@/lib/collaboration/viewport'
import supabase from '@/lib/supabase/client'
import useCollaborationUIStore from '@/store/collaboration-ui'
import { useThrottledCallback } from './use-throttled-callback'

const UI_STATE_EVENT = 'collab-ui-state'
const UI_ACTION_EVENT = 'collab-ui-action'
const CLICK_EVENT = 'collab-mouse-click'

/**
 * 生成当前协作者在协作 UI 中使用的展示颜色。
 *
 * 颜色会用于远程抽屉状态、点击动画等视觉反馈，方便区分不同用户。
 *
 * @returns 一个 HSL 颜色字符串
 */
function generateRandomColor() {
  return `hsl(${Math.floor(Math.random() * 360)}, 85%, 65%)`
}

interface UseRealtimeCollabUIOptions {
  roomName: string
  username: string
  /** 当前抽屉状态 */
  drawerOpen: boolean
  /** 当前激活 tab */
  activeTabId: ORDERType
  /** 工具栏配置 */
  config?: {
    spacing: SpacingConfigType
    font: FontConfigType
    theme: ThemeConfigType
  }
  /** 当前滚动位置 */
  getScrollPosition?: () => number
  /** 节流间隔（ms） */
  throttleMs?: number
}

interface UseRealtimeCollabUIReturn {
  /** 广播一个 UI 动作给所有协作者 */
  broadcastUIAction: (action: UIAction) => void
  /** 广播点击事件 */
  broadcastClick: (
    position: { x: number, y: number },
    targetLabel?: string,
  ) => void
  /** 当前用户 ID */
  userId: number
}

/**
 * 在协作房间中同步编辑器 UI 状态和显式交互动作。
 *
 * 该 Hook 基于 Supabase Realtime channel 建立一个独立的 `:ui` 频道，
 * 专门广播与文档内容无关但会影响协作感知的界面状态，例如：
 * - 抽屉是否展开
 * - 当前激活的配置 Tab
 * - 当前滚动位置和样式配置
 * - 鼠标点击位置与点击目标标签
 *
 * 同时它还会订阅其他协作者的广播，并把结果写入协作 UI store，
 * 供页面上的远程操作提示、点击动画和状态镜像组件消费。
 *
 * @param options 协作 UI 同步配置
 * @param options.roomName 当前协作房间名称
 * @param options.username 当前用户显示名称
 * @param options.drawerOpen 当前本地抽屉开关状态
 * @param options.activeTabId 当前本地激活的配置 Tab
 * @param options.config 需要与其他协作者共享的样式配置快照
 * @param options.getScrollPosition 获取当前滚动位置的函数；未提供时默认为 `0`
 * @param options.throttleMs UI 状态广播的节流间隔，单位毫秒
 * @returns 一个对象，包含广播 UI 动作、广播点击事件的方法，以及当前临时用户 ID
 */
export function useRealtimeCollabUI({
  roomName,
  username,
  drawerOpen,
  activeTabId,
  config,
  getScrollPosition,
  throttleMs = 100,
}: UseRealtimeCollabUIOptions): UseRealtimeCollabUIReturn {
  const [userId] = useState(createRealtimeUserId)
  const [color] = useState(() => generateRandomColor())
  const channelRef = useRef<RealtimeChannel | null>(null)

  const updateRemoteUIState = useCollaborationUIStore(
    s => s.updateRemoteUIState,
  )
  const addRemoteClick = useCollaborationUIStore(s => s.addRemoteClick)
  const setLatestRemoteAction = useCollaborationUIStore(
    s => s.setLatestRemoteAction,
  )
  const removeRemoteUser = useCollaborationUIStore(s => s.removeRemoteUser)
  const reset = useCollaborationUIStore(s => s.reset)

  // 广播当前 UI 状态（节流）
  const broadcastState = useCallback(() => {
    if (!channelRef.current)
      return

    const payload: UIStateBroadcastPayload = {
      type: 'ui-state-update',
      userId,
      userName: username,
      color,
      state: {
        drawerOpen,
        activeTabId,
        scrollPosition: getScrollPosition?.() ?? 0,
        config,
      },
      timestamp: Date.now(),
    }

    channelRef.current.send({
      type: 'broadcast',
      event: UI_STATE_EVENT,
      payload,
    })
  }, [
    userId,
    username,
    color,
    drawerOpen,
    activeTabId,
    config,
    getScrollPosition,
  ])

  const throttledBroadcastState = useThrottledCallback(
    broadcastState,
    throttleMs,
    [broadcastState],
  )

  // 当 UI 状态变化时自动广播
  useEffect(() => {
    throttledBroadcastState()
  }, [drawerOpen, activeTabId, config, throttledBroadcastState])

  // 广播 UI 动作（精确事件，用于驱动远程端 UI 操作）
  const broadcastUIAction = useCallback(
    (action: UIAction) => {
      if (!channelRef.current)
        return

      const payload: UIActionBroadcastPayload = {
        type: 'ui-action',
        action,
        userId,
        userName: username,
        color,
        timestamp: Date.now(),
      }

      channelRef.current.send({
        type: 'broadcast',
        event: UI_ACTION_EVENT,
        payload,
      })
    },
    [userId, username, color],
  )

  // 广播点击事件
  const broadcastClick = useCallback(
    (position: { x: number, y: number }, targetLabel?: string) => {
      if (!channelRef.current)
        return

      const payload: ClickEventBroadcastPayload = {
        type: 'mouse-click',
        userId,
        userName: username,
        color,
        position,
        viewport: getViewportSize(),
        targetLabel,
        timestamp: Date.now(),
      }

      channelRef.current.send({
        type: 'broadcast',
        event: CLICK_EVENT,
        payload,
      })
    },
    [userId, username, color],
  )

  // 建立 channel 订阅
  useEffect(() => {
    const channelName = `${roomName}:ui`
    const channel = supabase.channel(channelName)

    channel
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((presence) => {
          const leftUserId = getPresenceUserId(presence)

          if (leftUserId === null || leftUserId === userId)
            return

          removeRemoteUser(leftUserId)
        })
      })
      // 监听 UI 状态更新
      .on(
        'broadcast',
        { event: UI_STATE_EVENT },
        (data: { payload: UIStateBroadcastPayload }) => {
          if (data.payload.userId === userId)
            return
          updateRemoteUIState(data.payload)
        },
      )
      // 监听 UI 动作
      .on(
        'broadcast',
        { event: UI_ACTION_EVENT },
        (data: { payload: UIActionBroadcastPayload }) => {
          if (data.payload.userId === userId)
            return
          setLatestRemoteAction(data.payload)
        },
      )
      // 监听点击事件
      .on(
        'broadcast',
        { event: CLICK_EVENT },
        (data: { payload: ClickEventBroadcastPayload }) => {
          if (data.payload.userId === userId)
            return
          addRemoteClick({
            ...data.payload,
            position: projectPointToViewport(
              data.payload.position,
              data.payload.viewport,
            ),
          })
        },
      )
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          channelRef.current = channel
          await channel.track({
            userId,
            metadata: {
              userId,
              userName: username,
              color,
            },
            onlineAt: new Date().toISOString(),
          })
          // 首次订阅成功后立即广播当前状态
          broadcastState()
        }
        else {
          channelRef.current = null
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
      reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, userId])

  // 监听本地鼠标点击并广播
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // 获取点击目标的文本作为 label
      const target = e.target as HTMLElement
      let targetLabel: string | undefined
      if (target) {
        // 尝试获取有意义的 label
        const closestButton = target.closest('button')
        const closestTab = target.closest('[data-tab-id]')
        const closestSwitch = target.closest('[role="switch"]')

        if (closestTab) {
          targetLabel = closestTab.getAttribute('data-tab-id') ?? undefined
        }
        else if (closestButton) {
          targetLabel
            = closestButton.textContent?.trim().slice(0, 20) ?? undefined
        }
        else if (closestSwitch) {
          targetLabel = '开关'
        }
      }

      broadcastClick({ x: e.clientX, y: e.clientY }, targetLabel)
    }

    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [broadcastClick])

  return {
    broadcastUIAction,
    broadcastClick,
    userId,
  }
}
