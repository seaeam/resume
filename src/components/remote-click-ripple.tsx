/**
 * 远程点击波纹效果组件
 *
 * 在远程协作者点击位置显示一个扩散消失的波纹动画，
 * 提供视觉反馈，让本地用户知道远程用户点击了什么地方。
 */
import { useEffect, useState } from 'react'

interface RemoteClickRippleProps {
  x: number
  y: number
  color: string
  label?: string
}

export function RemoteClickRipple({ x, y, color, label }: RemoteClickRippleProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 560)
    return () => clearTimeout(timer)
  }, [])

  if (!visible)
    return null

  return (
    <div
      className="pointer-events-none fixed z-60"
      style={{
        top: y,
        left: x,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* 外圈波纹 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 34,
          height: 34,
          top: -17,
          left: -17,
          border: `1.5px solid ${color}`,
          opacity: 0.45,
          animation: 'collab-ripple-expand 0.55s ease-out forwards',
        }}
      />
      {/* 内圈圆点 */}
      <div
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          top: -3,
          left: -3,
          backgroundColor: color,
          opacity: 0.75,
          animation: 'collab-ripple-dot 0.55s ease-out forwards',
        }}
      />
      {/* 标签文字 */}
      {label && (
        <div
          className="absolute whitespace-nowrap rounded px-1 py-0.5 text-[10px] font-medium"
          style={{
            top: 10,
            left: 10,
            backgroundColor: color,
            color: 'white',
            opacity: 0.9,
            animation: 'collab-ripple-label 0.55s ease-out forwards',
          }}
        >
          {label}
        </div>
      )}
    </div>
  )
}
