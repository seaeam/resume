import type { RealtimeChannel } from '@supabase/supabase-js'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import supabase from '@/lib/supabase/client'
import { useThrottledCallback } from '@/hooks/use-throttled-callback'

const generateRandomColor = () => `hsl(${Math.floor(Math.random() * 360)}, 100%, 70%)`

const generateRandomNumber = () => Math.floor(Math.random() * 100)

const EVENT_NAME = 'realtime-cursor-move'

interface CursorEventPayload {
  position: {
    x: number
    y: number
  }
  user: {
    id: number
    name: string
  }
  color: string
  timestamp: number
}

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
    (event: MouseEvent) => {
      const { clientX, clientY } = event

      const payload: CursorEventPayload = {
        position: {
          x: clientX,
          y: clientY,
        },
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

  const handleMouseMove = useThrottledCallback(callback, throttleMs, [callback])

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

        setCursors((prev) => {
          const next = { ...prev }
          delete next[userId]
          return {
            ...next,
            [user.id]: data.payload,
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
    // Add event listener for mousemove
    window.addEventListener('mousemove', handleMouseMove)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleMouseMove])

  return { cursors }
}
