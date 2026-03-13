'use client'

import * as React from 'react'
import { useThrottledCallback } from './use-throttled-callback'

export type RectState = Omit<DOMRect, 'toJSON'>

export interface ElementRectOptions {
  /**
   * 需要追踪的目标元素。
   * 可以直接传入 `Element`、React `ref` 或 CSS 选择器字符串。
   * 未提供时默认追踪 `document.body`。
   */
  element?: Element | React.RefObject<Element> | string | null
  /**
   * 是否启用矩形追踪。
   */
  enabled?: boolean
  /**
   * 矩形更新的节流间隔，单位毫秒。
   */
  throttleMs?: number
  /**
   * 是否启用 `ResizeObserver` 以更准确地响应元素尺寸变化。
   */
  useResizeObserver?: boolean
}

const initialRect: RectState = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

const isSSR = typeof window === 'undefined'
const hasResizeObserver = !isSSR && typeof ResizeObserver !== 'undefined'

/**
 * 判断当前代码是否运行在浏览器客户端环境。
 *
 * 该函数用于在访问 `window`、`document`、`ResizeObserver`
 * 等仅浏览器可用的 API 之前进行保护，避免 SSR 阶段报错。
 *
 * @returns 当前是否处于可安全访问浏览器 API 的客户端环境
 */
const isClientSide = (): boolean => !isSSR

/**
 * 实时追踪目标元素的 `getBoundingClientRect()` 结果。
 *
 * Hook 支持通过三种方式指定目标元素：
 * - 直接传入 `Element`
 * - 传入 React `ref`
 * - 传入 CSS 选择器字符串
 *
 * 若未提供 `element`，默认追踪 `document.body`。
 * 当窗口滚动、窗口尺寸变化，或启用了 `ResizeObserver` 且目标元素尺寸变化时，
 * Hook 会以节流方式更新矩形状态。
 *
 * 适用于吸顶判断、悬浮层定位、可视范围计算等依赖元素位置信息的场景。
 *
 * @param options 追踪配置
 * @param options.element 需要观测的目标元素、ref 或选择器；省略时默认为 `document.body`
 * @param options.enabled 是否启用追踪；关闭时会返回初始空矩形
 * @param options.throttleMs 矩形更新的节流间隔，单位毫秒
 * @param options.useResizeObserver 是否启用 `ResizeObserver` 监听元素尺寸变化
 * @returns 当前目标元素的矩形快照；在不可用场景下返回零值矩形
 */
export function useElementRect({
  element,
  enabled = true,
  throttleMs = 100,
  useResizeObserver = true,
}: ElementRectOptions = {}): RectState {
  const [rect, setRect] = React.useState<RectState>(initialRect)

  const getTargetElement = React.useCallback((): Element | null => {
    if (!enabled || !isClientSide())
      return null

    if (!element) {
      return document.body
    }

    if (typeof element === 'string') {
      return document.querySelector(element)
    }

    if ('current' in element) {
      return element.current
    }

    return element
  }, [element, enabled])

  const updateRect = useThrottledCallback(
    () => {
      if (!enabled || !isClientSide())
        return

      const targetElement = getTargetElement()
      if (!targetElement) {
        setRect(initialRect)
        return
      }

      const newRect = targetElement.getBoundingClientRect()
      setRect({
        x: newRect.x,
        y: newRect.y,
        width: newRect.width,
        height: newRect.height,
        top: newRect.top,
        right: newRect.right,
        bottom: newRect.bottom,
        left: newRect.left,
      })
    },
    throttleMs,
    [enabled, getTargetElement],
    { leading: true, trailing: true },
  )

  React.useEffect(() => {
    if (!enabled || !isClientSide()) {
      setRect(initialRect)
      return
    }

    const targetElement = getTargetElement()
    if (!targetElement)
      return

    updateRect()

    let animationFrameId: number | null = null
    let resizeObserver: ResizeObserver | null = null

    if (useResizeObserver && hasResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        if (animationFrameId !== null) {
          window.cancelAnimationFrame(animationFrameId)
        }

        animationFrameId = window.requestAnimationFrame(() => {
          updateRect()
          animationFrameId = null
        })
      })
      resizeObserver.observe(targetElement)
    }

    const handleWindowUpdate = () => updateRect()

    window.addEventListener('scroll', handleWindowUpdate, { passive: true })
    window.addEventListener('resize', handleWindowUpdate, { passive: true })

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      resizeObserver?.disconnect()
      window.removeEventListener('scroll', handleWindowUpdate)
      window.removeEventListener('resize', handleWindowUpdate)
      setRect(initialRect)
    }
  }, [enabled, getTargetElement, updateRect, useResizeObserver])

  return rect
}

/**
 * 追踪 `document.body` 的矩形信息。
 *
 * 这是 `useElementRect` 的便捷封装，自动将追踪目标固定为 `document.body`，
 * 适合页面整体高度、正文区域位置等全局布局测量场景。
 *
 * @param options 除 `element` 外的其余追踪配置
 * @returns `document.body` 的当前矩形信息
 */
export function useBodyRect(
  options: Omit<ElementRectOptions, 'element'> = {},
): RectState {
  return useElementRect({
    ...options,
    element: isClientSide() ? document.body : null,
  })
}

/**
 * 追踪某个 ref 元素的矩形信息。
 *
 * 这是 `useElementRect` 的便捷封装，调用方只需传入元素 ref，
 * 即可持续获得该元素的矩形变化结果。
 *
 * @param ref 需要观测的元素 ref
 * @param options 除 `element` 外的其余追踪配置
 * @returns ref 当前指向元素的矩形信息
 */
export function useRefRect<T extends Element>(
  ref: React.RefObject<T>,
  options: Omit<ElementRectOptions, 'element'> = {},
): RectState {
  return useElementRect({ ...options, element: ref })
}
