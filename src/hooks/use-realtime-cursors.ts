import type { RealtimeChannel } from '@supabase/supabase-js'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useThrottledCallback } from '@/hooks/use-throttled-callback'
import { getViewportSize, projectPointToViewport } from '@/lib/collaboration/viewport'
import supabase from '@/lib/supabase/client'

/**
 * 为当前协作者生成一个随机的光标颜色。
 *
 * 颜色仅用于前端视觉区分，不依赖持久化身份体系。
 *
 * @returns 一个适合高亮显示的 HSL 颜色字符串
 */
const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

/**
 * 生成当前协作者在光标同步频道中使用的临时用户 ID。
 *
 * @returns 一个用于本地去重和 Presence 追踪的随机整数
 */
const generateRandomNumber = () => Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

interface CursorEventPayload {
  position: {
    x: number
    y: number
  }
  viewport?: {
    width: number
    height: number
  }
  user: {
    id: number
    name: string
  }
  color: string
  timestamp: number
}

/**
 * 在协作房间中同步并接收远程光标位置。
 *
 * Hook 会监听本地 `pointermove` 事件，并以节流方式把当前鼠标位置、
 * 用户信息和视口尺寸广播到 Supabase Realtime 频道中。
 * 同时会订阅其他协作者的光标广播，在收到数据后根据发送方视口尺寸
 * 投影到本地当前视口，保证不同屏幕尺寸下的光标位置更接近真实操作区域。
 *
 * 当协作者离开房间时，对应的光标会自动从结果中移除。
 *
 * @param options 光标同步配置
 * @param options.roomName 当前协作房间名称
 * @param options.username 当前用户显示名称
 * @param options.throttleMs 本地光标广播的节流间隔，单位毫秒
 * @returns 一个对象，其中 `cursors` 为当前已知的远程光标映射表
 */
export function useRealtimeCursors({
  roomName,
  username,
  throttleMs,
}: {
  roomName: string
  username: string
  throttleMs: number
}) {
  const [color] = useState(() => generateRandomColor())
  const [userId] = useState(() => generateRandomNumber())
  const [cursors, setCursors] = useState<Record<string, CursorEventPayload>>({})
  const cursorPayload = useRef<CursorEventPayload | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const callback = useCallback(
    (event: PointerEvent) => {
      const { clientX, clientY } = event

      const payload: CursorEventPayload = {
        position: {
          x: clientX,
          y: clientY,
        },
        viewport: getViewportSize(),
        user: {
          id: userId,
          name: username,
        },
        color,
        timestamp: new Date().getTime(),
      }

      cursorPayload.current = payload

      channelRef.current?.send({
        type: 'broadcast',
        event: EVENT_NAME,
        payload,
      })
    },
    [color, userId, username],
  )

  const handlePointerMove = useThrottledCallback(callback, throttleMs, [callback], {
    leading: true,
    trailing: true,
  })

  useEffect(() => {
    const channel = supabase.channel(roomName)

    channel
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach((element) => {
          // Remove cursor when user leaves
          setCursors((prev) => {
            const next = { ...prev }
            delete next[element.key]
            return next
          })
        })
      })
      .on('presence', { event: 'join' }, () => {
        if (!cursorPayload.current)
          return

        // All cursors broadcast their position when a new cursor joins
        channelRef.current?.send({
          type: 'broadcast',
          event: EVENT_NAME,
          payload: cursorPayload.current,
        })
      })
      .on('broadcast', { event: EVENT_NAME }, (data: { payload: CursorEventPayload }) => {
        const { user } = data.payload
        // Don't render your own cursor
        if (user.id === userId)
          return

        const projectedPayload: CursorEventPayload = {
          ...data.payload,
          position: projectPointToViewport(data.payload.position, data.payload.viewport),
        }

        setCursors((prev) => {
          const next = { ...prev }
          delete next[userId]
          return {
            ...next,
            [user.id]: projectedPayload,
          }
        })
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          await channel.track({ key: userId })
          channelRef.current = channel
        }
        else {
          setCursors({})
          channelRef.current = null
        }
      })

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [roomName, username, userId, color])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
    }
  }, [handlePointerMove])

  return { cursors }
}
