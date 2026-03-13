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
  const [windowSize, setWindowSize] = React.useState<WindowSizeState>({
    width: 0,
    height: 0,
    offsetTop: 0,
    offsetLeft: 0,
    scale: 1,
  })

  const handleViewportChange = useThrottledCallback(() => {
    if (typeof window === 'undefined')
      return

    const vp = window.visualViewport
    if (!vp)
      return

    const {
      width = 0,
      height = 0,
      offsetTop = 0,
      offsetLeft = 0,
      scale = 0,
    } = vp

    setWindowSize((prevState) => {
      if (
        width === prevState.width
        && height === prevState.height
        && offsetTop === prevState.offsetTop
        && offsetLeft === prevState.offsetLeft
        && scale === prevState.scale
      ) {
        return prevState
      }

      return { width, height, offsetTop, offsetLeft, scale }
    })
  }, 200)

  React.useEffect(() => {
    const visualViewport = window.visualViewport
    if (!visualViewport)
      return

    visualViewport.addEventListener('resize', handleViewportChange)

    handleViewportChange()

    return () => {
      visualViewport.removeEventListener('resize', handleViewportChange)
    }
  }, [handleViewportChange])

  return windowSize
}
