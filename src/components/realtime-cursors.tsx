'use client'

import { Cursor } from '@/components/cursor'
import { RemoteClickRipple } from '@/components/remote-click-ripple'
import { useRealtimeCursors } from '@/hooks/use-realtime-cursors'
import useCollaborationUIStore from '@/store/collaboration-ui'

const THROTTLE_MS = 12

export function RealtimeCursors({ roomName, username }: { roomName: string, username: string }) {
  const { cursors } = useRealtimeCursors({ roomName, username, throttleMs: THROTTLE_MS })
  const remoteClicks = useCollaborationUIStore(s => s.remoteClicks)

  return (
    <div>
      {/* 远程光标 */}
      {Object.keys(cursors).map(id => (
        <Cursor
          key={id}
          className="fixed z-50"
          style={{
            top: 0,
            left: 0,
            willChange: 'transform',
            zIndex: 10000,
          }}
          point={cursors[id].position}
          color={cursors[id].color}
          name={cursors[id].user.name}
        />
      ))}

      {/* 远程点击波纹效果 */}
      {remoteClicks.map(click => (
        <RemoteClickRipple
          key={`${click.userId}-${click.timestamp}`}
          x={click.position.x}
          y={click.position.y}
          color={click.color}
          label={click.targetLabel}
        />
      ))}
    </div>
  )
}
