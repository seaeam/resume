import type { RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'

type ScrollTarget = RefObject<HTMLElement> | Window | null | undefined
type EventTargetWithScroll = Window | HTMLElement | Document

interface UseScrollingOptions {
  debounce?: number
  fallbackToDocument?: boolean
}

function resolveScrollTarget(
  target?: ScrollTarget,
): Window | HTMLElement | null {
  if (!target)
    return null

  if (typeof Window !== 'undefined' && target instanceof Window) {
    return target
  }

  return target.current
}

/**
 * 监听目标容器的滚动状态，并在滚动期间返回 `true`。
 *
 * Hook 支持监听 `window`、元素 `ref` 或直接传入的 `Window` 对象。
 * 在不支持 `scrollend` 的环境中，会通过防抖计时器推断滚动结束时机；
 * 在移动端监听 `window` 时，也可以按需退回到 `document` 监听，
 * 以兼容部分浏览器事件派发差异。
 *
 * @param target 需要监听的滚动目标；可省略，默认监听当前窗口
 * @param options 滚动监听配置
 * @param options.debounce 当环境不支持 `scrollend` 时，判定“停止滚动”的防抖时长，单位毫秒
 * @param options.fallbackToDocument 监听 `window` 时是否改为绑定到 `document`
 * @returns 当前是否处于滚动中
 */
export function useScrolling(
  target?: ScrollTarget,
  options: UseScrollingOptions = {},
): boolean {
  const { debounce = 150, fallbackToDocument = true } = options
  const [isScrolling, setIsScrolling] = useState(false)
  const isScrollingRef = useRef(false)
  const resolvedTarget = resolveScrollTarget(target)

  const updateScrollingState = (nextValue: boolean) => {
    if (isScrollingRef.current === nextValue)
      return

    isScrollingRef.current = nextValue
    setIsScrolling(nextValue)
  }

  useEffect(() => {
    if (typeof window === 'undefined')
      return

    const element: EventTargetWithScroll
      = resolvedTarget && resolvedTarget instanceof Window
        ? resolvedTarget
        : (resolvedTarget ?? window)

    const eventTarget: EventTargetWithScroll
      = fallbackToDocument
        && element === window
        && typeof document !== 'undefined'
        ? document
        : element

    let timeout: ReturnType<typeof setTimeout>
    const supportsScrollEnd = element === window && 'onscrollend' in window

    const handleScroll = () => {
      updateScrollingState(true)
      if (!supportsScrollEnd) {
        clearTimeout(timeout)
        timeout = setTimeout(() => updateScrollingState(false), debounce)
      }
    }

    const handleScrollEnd = () => updateScrollingState(false)

    eventTarget.addEventListener('scroll', handleScroll, { passive: true })
    if (supportsScrollEnd) {
      eventTarget.addEventListener('scrollend', handleScrollEnd, {
        passive: true,
      })
    }

    return () => {
      eventTarget.removeEventListener('scroll', handleScroll)
      if (supportsScrollEnd) {
        eventTarget.removeEventListener('scrollend', handleScrollEnd)
      }
      clearTimeout(timeout)
      updateScrollingState(false)
    }
  }, [resolvedTarget, debounce, fallbackToDocument])

  return isScrolling
}
