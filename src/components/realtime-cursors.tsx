'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { Cursor } from '@/components/cursor'
import { useRealtimeCursors } from '@/hooks/use-realtime-cursors'

const THROTTLE_MS = 50

export function RealtimeCursors({ roomName, username }: { roomName: string, username: string }) {
  const { cursors } = useRealtimeCursors({ roomName, username, throttleMs: THROTTLE_MS })
  // 使用 window.innerWidth/innerHeight 与发送端保持一致
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const updateSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
    
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  if (typeof document === 'undefined')
    return null

  const { width, height } = windowSize

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {Object.keys(cursors).map((id) => {
        const cursorX = cursors[id].position.x * width
        const cursorY = cursors[id].position.y * height
        
        // 确保光标在可视范围内
        if (cursorX < 0 || cursorY < 0 || cursorX > width || cursorY > height) {
          return null
        }
        
        return (
          <Cursor
            key={id}
            className="absolute transition-all ease-linear z-50"
            style={{
              transitionDuration: '50ms',
              left: `${cursorX}px`,
              top: `${cursorY}px`,
            }}
            color={cursors[id].color}
            name={cursors[id].user.name}
          />
        )
      })}
    </div>,
    document.body,
  )
}
