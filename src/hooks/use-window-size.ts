'use client'

import * as React from 'react'
import { useThrottledCallback } from './use-throttled-callback'

export interface WindowSizeState {
  /**
   * 当前可视视口的宽度，单位像素。
   */
  width: number
  /**
   * 当前可视视口的高度，单位像素。
   */
  height: number
  /**
   * 可视视口顶部距离布局视口顶部的偏移量。
   * 在移动端软键盘弹出时尤其有用。
   */
  offsetTop: number
  /**
   * 可视视口左侧距离布局视口左侧的偏移量。
   */
  offsetLeft: number
  /**
   * 当前可视视口的缩放比例。
   * 可用于根据页面缩放级别调整浮层或辅助元素。
   */
  scale: number
}

const DEFAULT_WINDOW_SIZE: WindowSizeState = {
  width: 0,
  height: 0,
  offsetTop: 0,
  offsetLeft: 0,
  scale: 1,
}

function getViewportSnapshot(): WindowSizeState {
  if (typeof window === 'undefined') {
    return DEFAULT_WINDOW_SIZE
  }

  const viewport = window.visualViewport
  if (!viewport) {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    }
  }

  return {
    width: viewport.width,
    height: viewport.height,
    offsetTop: viewport.offsetTop,
    offsetLeft: viewport.offsetLeft,
    scale: viewport.scale,
  }
}

function isSameWindowSize(a: WindowSizeState, b: WindowSizeState) {
  return (
    a.width === b.width
    && a.height === b.height
    && a.offsetTop === b.offsetTop
    && a.offsetLeft === b.offsetLeft
    && a.scale === b.scale
  )
}

/**
 * 监听浏览器可视视口（Visual Viewport）的尺寸与偏移变化。
 *
 * 与传统的 `window.innerWidth/innerHeight` 相比，
 * `visualViewport` 能更准确地反映移动端键盘弹出、页面缩放后的真实可见区域。
 * Hook 会在视口尺寸、偏移量或缩放比例变化时更新状态，并在值未变化时跳过 setState，
 * 以减少不必要的渲染。
 *
 * 适用于悬浮工具栏、光标跟随、弹层定位等依赖真实可见区域的场景。
 *
 * @returns 当前可视视口的宽高、偏移量和缩放比例
 */
export function useWindowSize(): WindowSizeState {
  const [windowSize, setWindowSize]
    = React.useState<WindowSizeState>(getViewportSnapshot)

  const handleViewportChange = useThrottledCallback(() => {
    const nextSnapshot = getViewportSnapshot()
    setWindowSize((prevState) => {
      return isSameWindowSize(prevState, nextSnapshot)
        ? prevState
        : nextSnapshot
    })
  }, 200)

  React.useEffect(() => {
    if (typeof window === 'undefined')
      return

    const visualViewport = window.visualViewport
    handleViewportChange()

    window.addEventListener('resize', handleViewportChange, { passive: true })
    visualViewport?.addEventListener('resize', handleViewportChange)
    visualViewport?.addEventListener('scroll', handleViewportChange)

    return () => {
      window.removeEventListener('resize', handleViewportChange)
      visualViewport?.removeEventListener('resize', handleViewportChange)
      visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [handleViewportChange])

  return windowSize
}
